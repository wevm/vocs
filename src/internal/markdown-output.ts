import { createHash } from 'node:crypto'
import type { Root, RootContent } from 'mdast'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

/** A build-time representation of a component. Props contain static MDX values only. */
export type MarkdownRenderer<Props = Record<string, unknown>> = (
  props: Props,
  context: {
    /** Canonical route of the containing page. */
    pageUrl: string
    /** True when the component occurs inside a paragraph; return phrasing nodes. */
    inline: boolean
    /** Already transformed children; return these to unwrap a layout component. */
    renderChildren(): RootContent[]
  },
) => RootContent[] | Promise<RootContent[]>

/** Override a component by its resolved module and exported name, never its local MDX alias. */
export type MarkdownComponentOverride = {
  /** Import specifier, resolved relative to the site root. */
  module: string
  /** Export name, or `default` for a default export. */
  export: string
  render: MarkdownRenderer
}

/** Options shared by page Markdown, llms.txt, llms-full.txt, and the audit command. */
export type MarkdownOutputConfig = {
  /** Same checks in both modes. Defaults to `warn`; `fail` blocks builds with findings. */
  validation?: 'warn' | 'fail' | undefined
  /** Site overrides take precedence over module-level `markdown` declarations. */
  components?: readonly MarkdownComponentOverride[] | undefined
}

export type Diagnostic = {
  rule: string
  message: string
  file: string
  /** Positions refer to generated Markdown, after all output transforms. */
  line?: number | undefined
  column?: number | undefined
  component?: string | undefined
}

/** Resolve enforcement without disabling any checks. Invalid overrides are configuration errors. */
export function resolveValidation(options: resolveValidation.Options = {}) {
  const environment = options.environment ?? process.env['VOCS_MARKDOWN_VALIDATION']
  const entries = [options.cli, environment, options.config]
  for (const value of entries)
    if (value !== undefined && value !== 'warn' && value !== 'fail')
      throw new TypeError(`Invalid Markdown validation mode "${value}". Expected warn or fail.`)
  return {
    validation: (options.cli ?? environment ?? options.config ?? 'warn') as 'warn' | 'fail',
    validationSource:
      options.cli !== undefined
        ? 'cli'
        : environment !== undefined
          ? 'environment'
          : options.config !== undefined
            ? 'config'
            : 'default',
  }
}
export declare namespace resolveValidation {
  type Options = {
    cli?: string | undefined
    environment?: string | undefined
    config?: string | undefined
  }
}

/** Inspect the final output AST. Code and inline-code nodes are intentionally opaque. */
export function inspect(content: string, file: string, pages?: ReadonlySet<string>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  let tree: Root
  try {
    tree = unified().use(remarkParse).use(remarkMdx).parse(maskComments(content))
  } catch (error) {
    return [
      {
        rule: 'invalid-markdown',
        file,
        message: error instanceof Error ? error.message : String(error),
      },
    ]
  }
  visit(tree, (node) => {
    // Only explicit Markdown-export links are checked here. Ordinary website links may
    // target React routes, redirects, assets, or another application on the same host.
    if (
      pages &&
      (node.type === 'link' || node.type === 'definition') &&
      !/^(?:[a-z]+:|\/\/)/i.test(node.url)
    ) {
      const url = new URL(node.url, `https://vocs.invalid${file}`)
      if (url.pathname.endsWith('.md')) {
        const route = url.pathname.replace(/\.md$/, '').replace(/\/index$/, '') || '/'
        if (!pages.has(route))
          diagnostics.push({
            rule: 'broken-export-link',
            file,
            message: `No generated Markdown page for ${node.url}.`,
            line: node.position?.start.line,
            column: node.position?.start.column,
          })
      }
    }
    if (node.type === 'mdxjsEsm')
      diagnostics.push({
        rule: 'unhandled-javascript',
        file,
        message: 'JavaScript remains after Markdown transforms.',
        line: node.position?.start.line,
        column: node.position?.start.column,
      })
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      for (const attribute of node.attributes) {
        if (
          attribute.type === 'mdxJsxExpressionAttribute' ||
          (attribute.value && typeof attribute.value === 'object')
        )
          diagnostics.push({
            rule: 'unhandled-expression',
            file,
            message: 'An unresolved JSX attribute remains in Markdown.',
            line: node.position?.start.line,
            column: node.position?.start.column,
          })
      }
      if (!node.name || !/^[A-Z]/.test(node.name)) return
      diagnostics.push({
        rule: 'unhandled-component',
        file,
        component: node.name,
        message: `Add a markdown renderer for <${node.name}>.`,
        line: node.position?.start.line,
        column: node.position?.start.column,
      })
    }
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      // Empty expressions contain comments, not omitted runtime content.
      if (!node.data?.estree?.body.length) return
      diagnostics.push({
        rule: 'unhandled-expression',
        file,
        message: 'Provide static Markdown for this expression.',
        line: node.position?.start.line,
        column: node.position?.start.column,
      })
    }
  })
  if (!content.trim())
    diagnostics.push({ rule: 'empty-page', file, message: 'The page has no Markdown content.' })
  return diagnostics
}

/** Deterministic hashes let deployment tooling compare served bytes with this build. */
export function manifest(files: Record<string, string>) {
  return {
    version: 1,
    files: Object.fromEntries(
      Object.entries(files)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, content]) => [path, createHash('sha256').update(content).digest('hex')]),
    ),
  }
}

/** Shared terminal formatting for the CLI and Vite's warning/error hooks. */
export function format(report: format.Report) {
  return [
    `[vocs] Markdown validation: ${report.validation} (${report.validationSource}); ${report.diagnostics.length} findings.`,
    ...report.diagnostics.map(
      (item) =>
        `${item.file}${item.line ? `:${item.line}:${item.column ?? 1}` : ''} [${item.rule}] ${item.message}`,
    ),
  ].join('\n')
}
export declare namespace format {
  type Report = ReturnType<typeof resolveValidation> & { diagnostics: Diagnostic[] }
}

/** Compare deployed response bytes with a manifest saved by the build, including CDN routing. */
export async function verifyDeployment(options: verifyDeployment.Options): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = []
  const base = new URL(options.url.endsWith('/') ? options.url : `${options.url}/`)
  // Sequential fetches bound load on the deployment and keep diagnostics deterministic.
  for (const [file, expected] of Object.entries(options.manifest.files)) {
    try {
      const response = await (options.fetch ?? globalThis.fetch)(
        new URL(file.replace(/^\//, ''), base),
        {
          signal: AbortSignal.timeout(15_000),
        },
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const contentType = response.headers.get('content-type') ?? ''
      if (!/^text\/(plain|markdown)(?:;|$)/i.test(contentType))
        throw new Error(`Expected Markdown/text, received ${contentType || 'no content type'}`)
      const body = await response.text()
      if (createHash('sha256').update(body).digest('hex') !== expected)
        throw new Error('Response does not match the build artifact')
    } catch (error) {
      diagnostics.push({
        rule: 'deployment-mismatch',
        file,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return diagnostics
}
export declare namespace verifyDeployment {
  type Options = {
    url: string
    manifest: ReturnType<typeof manifest>
    fetch?: typeof globalThis.fetch
  }
}

/** HTML comments are valid Markdown output but MDX's parser rejects them. Mask only
 * comment spans in parsed HTML nodes, retaining offsets for useful diagnostics. */
function maskComments(content: string) {
  const tree = unified().use(remarkParse).parse(content)
  const spans: { start: number; end: number }[] = []
  visit(tree, 'html', (node) => {
    const offset = node.position?.start.offset
    if (offset === undefined) return
    for (const match of node.value.matchAll(/<!--[\s\S]*?-->/g))
      spans.push({ start: offset + match.index, end: offset + match.index + match[0].length })
  })
  for (const { start, end } of spans.sort((a, b) => b.start - a.start))
    content =
      content.slice(0, start) +
      content.slice(start, end).replace(/[^\n\r]/g, ' ') +
      content.slice(end)
  return content
}
