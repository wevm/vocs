import * as fs from 'node:fs/promises'
import type * as MdAst from 'mdast'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { PluggableList } from 'unified'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import * as MarkdownComponents from './markdown-components.js'
import * as MarkdownImports from './markdown-imports.js'

/**
 * The Markdown audit deliberately follows the same local transformation path as Vocs' Markdown
 * twins. It reads every page, expands imported Markdown, runs `toMarkdown` hooks, and then runs
 * the configured Markdown processor. The final pass only reports PascalCase MDX tags that survive
 * that dry render, so a component with a working Markdown representation is never flagged.
 *
 * This module does not fetch a built site or make network requests. The CLI supplies the site's
 * configured remark/rehype plugins and import resolver, allowing aliases and local components to
 * behave as they do during a normal Vocs build.
 */
type MdxJsxElement = MdAst.RootContent & {
  attributes?: unknown[]
  children?: MdAst.RootContent[]
  name?: string | null
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement'
}

/** Finds MDX components that remain in the Markdown generated for a set of pages. */
export async function audit(options: audit.Options): Promise<audit.Result> {
  const components = new Map<string, audit.Component>()
  const errors: audit.PageError[] = []

  for (const page of options.pages) {
    // Read source from disk when auditing a site. String pages keep the helper convenient for
    // callers that already have page content, but cannot resolve component imports on their own.
    const source =
      typeof page.content === 'string' ? page.content : await fs.readFile(page.content.path, 'utf8')
    const filePath = typeof page.content === 'string' ? undefined : page.content.path

    let markdown = source
    try {
      // First reproduce the part of Markdown generation that is specific to MDX components:
      // imported Markdown is inlined recursively and standalone components get a chance to
      // replace themselves through `toMarkdown`.
      if (filePath)
        markdown = await MarkdownImports.inlineMarkdownImportsAsync(
          source,
          filePath,
          (content, path) =>
            MarkdownComponents.inlineMarkdownComponents(content, path, options.componentOptions),
        )

      // Then perform the site's real Markdown processing. This lets configured remark/rehype
      // plugins remove, rewrite, or add content before the audit decides what still remains.
      markdown = String(
        await unified()
          .use(remarkParse)
          .use(remarkMdx)
          .use(remarkStringify)
          .use(options.remarkPlugins ?? [])
          .use(options.rehypePlugins ?? [])
          .process(markdown),
      )
    } catch (error) {
      // A failed component hook should not hide findings from unrelated pages. Keep the original
      // Markdown for inspection and put the render failure in the report alongside the findings.
      errors.push({
        error: error instanceof Error ? error.message : String(error),
        path: page.path,
      })
    }

    let tree: MdAst.Root
    try {
      // Parse the fully rendered Markdown, rather than the source MDX. A remaining MDX JSX node
      // here is precisely what an AI-facing Markdown consumer would receive.
      tree = unified().use(remarkParse).use(remarkMdx).parse(markdown)
    } catch (error) {
      errors.push({
        error: error instanceof Error ? error.message : String(error),
        path: page.path,
      })
      continue
    }

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      const component = node as MdxJsxElement
      if (!isMdxComponent(component)) return

      // Aggregate by component first, then route. This gives maintainers one fix per component
      // while still showing the complete set of pages affected by that missing representation.
      const finding = components.get(component.name) ?? {
        name: component.name,
        pages: new Map(),
        unsupportedUsages: 0,
      }
      const pageFinding = finding.pages.get(page.path) ?? { count: 0, path: page.path }
      pageFinding.count += 1
      finding.pages.set(page.path, pageFinding)
      if (!isStandalone(component)) finding.unsupportedUsages += 1
      components.set(component.name, finding)
    })
  }

  return {
    components: [...components.values()]
      .map((component) => {
        const pages = [...component.pages.values()].sort((a, b) => a.path.localeCompare(b.path))
        return { ...component, count: pages.reduce((count, page) => count + page.count, 0), pages }
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    errors: errors.sort((a, b) => a.path.localeCompare(b.path) || a.error.localeCompare(b.error)),
  }
}

export declare namespace audit {
  type Options = {
    componentOptions?: MarkdownComponents.inlineMarkdownComponents.Options | undefined
    pages: Page[]
    rehypePlugins?: PluggableList | undefined
    remarkPlugins?: PluggableList | undefined
  }

  type Page = {
    content: string | { path: string }
    path: string
  }

  type Component = {
    name: string
    pages: Map<string, PageFinding>
    unsupportedUsages: number
  }

  type PageFinding = {
    count: number
    path: string
  }

  type PageError = {
    error: string
    path: string
  }

  type Result = {
    components: Array<Omit<Component, 'pages'> & { count: number; pages: PageFinding[] }>
    errors: PageError[]
  }
}

/** Formats a Markdown audit for terminal output. */
export function format(result: audit.Result): string {
  const pageCount = new Set(
    result.components.flatMap((component) => component.pages.map((page) => page.path)),
  ).size
  const occurrenceCount = result.components.reduce((count, component) => count + component.count, 0)

  if (result.components.length === 0 && result.errors.length === 0)
    return '[vocs] Markdown audit passed. No unrendered MDX components found.'

  // Keep the human report component-first: a single hook or content change commonly fixes many
  // routes, and the nested page counts make the highest-impact fixes immediately visible.
  const lines = [
    `[vocs] Markdown audit found ${result.components.length} ${pluralize('component', result.components.length)} left after dry rendering ${pageCount} ${pluralize('page', pageCount)} (${occurrenceCount} ${pluralize('occurrence', occurrenceCount)}).`,
  ]

  if (result.components.length > 0) {
    lines.push('', 'Components:')
    for (const component of result.components) {
      lines.push(
        `  ${component.name} (${component.count} ${pluralize('occurrence', component.count)})`,
      )
      lines.push(`    ${suggestion(component)}`)
      for (const page of component.pages)
        lines.push(`    ${page.path || '/'} (${page.count} ${pluralize('occurrence', page.count)})`)
    }
  }

  if (result.errors.length > 0) {
    lines.push('', 'Pages that could not be fully audited:')
    for (const error of result.errors) lines.push(`  ${error.path || '/'}: ${error.error}`)
  }

  return lines.join('\n')
}

function isMdxComponent(node: MdxJsxElement): node is MdxJsxElement & { name: string } {
  // Lowercase tags are HTML. Only PascalCase names (including namespaced MDX components such as
  // `HomePage.Button`) require a JavaScript component implementation and cannot be plain Markdown.
  return !!node.name && /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$]+)*$/.test(node.name)
}

function isStandalone(node: MdxJsxElement) {
  // Vocs currently invokes `toMarkdown` only for imported, self-closing flow components. Record
  // prop, child, inline, and namespaced usages separately so the report can recommend Markdown
  // replacement rather than suggesting a hook that cannot run for that invocation.
  return (
    node.type === 'mdxJsxFlowElement' &&
    node.attributes?.length === 0 &&
    node.children?.length === 0
  )
}

function pluralize(word: string, count: number) {
  return `${word}${count === 1 ? '' : 's'}`
}

function suggestion(component: audit.Result['components'][number]) {
  // Suggestions reflect the actual hook contract above instead of treating every MDX component as
  // hook-compatible. A component can have both standalone and unsupported usages across pages.
  if (component.unsupportedUsages === 0)
    return `Fix: add \`${component.name}.toMarkdown\` to return a Markdown AST node.`
  if (component.unsupportedUsages === component.count)
    return 'Fix: replace this prop or child usage with Markdown; `toMarkdown` only supports standalone components.'
  return `Fix: add \`${component.name}.toMarkdown\` for standalone usages; replace prop or child usages with Markdown.`
}
