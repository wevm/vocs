import type * as Hast from 'hast'
import type * as Mdast from 'mdast'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

const githubCalloutMap: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'info',
  WARNING: 'warning',
  CAUTION: 'danger',
}

const calloutIcons: Record<string, string> = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  danger:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
}

// Elements that should receive the data-v attribute for styling
const dataVElements = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'img',
])

/**
 * Remark plugin that transforms GitHub-style callouts (> [!NOTE]) into callout elements.
 */
function remarkGitHubCallouts() {
  return (tree: Mdast.Root) => {
    visit(tree, 'blockquote', (node: Mdast.Blockquote) => {
      const firstChild = node.children[0]
      if (firstChild?.type !== 'paragraph') return

      const para = firstChild
      const firstInline = para.children[0]
      if (firstInline?.type !== 'text') return

      const match = firstInline.value.match(/^\[!(\w+)\]\s*/)
      if (!match) return

      const calloutType = match[1]
      const variant = calloutType ? githubCalloutMap[calloutType] : undefined
      if (!variant) return

      // Remove the [!TYPE] prefix from the text
      firstInline.value = firstInline.value.slice(match[0].length)

      // If text is now empty, remove it
      if (firstInline.value === '') {
        para.children.shift()
      }

      // Mark this blockquote as a callout
      node.data = {
        hName: 'aside',
        hProperties: {
          'data-v-callout': true,
          'data-v-context': variant,
          'data-v': true,
          'data-v-content': true,
        },
      }
    })
  }
}

/**
 * Rehype plugin that adds data-v attributes for Vocs styling.
 */
function rehypeVocsAttrs() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element) => {
      if (dataVElements.has(node.tagName)) {
        node.properties = { ...node.properties, 'data-v': true }
      }
    })
  }
}

/**
 * Rehype plugin that wraps tables with a wrapper div for overflow handling.
 */
function rehypeTableWrapper() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element, index, parent) => {
      if (node.tagName !== 'table' || index === undefined || !parent) return

      const wrapper: Hast.Element = {
        type: 'element',
        tagName: 'div',
        properties: { 'data-v-table-wrapper': true },
        children: [node],
      }

      ;(parent as Hast.Parent).children[index] = wrapper
      return SKIP
    })
  }
}

/**
 * Rehype plugin that adds icons to callout elements.
 */
function rehypeCalloutIcons() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element) => {
      if (node.tagName !== 'aside' || !node.properties?.['data-v-callout']) return

      const variant = (node.properties['data-v-context'] as string) || 'note'
      const icon = calloutIcons[variant] || calloutIcons['note']

      const iconWrapper: Hast.Element = {
        type: 'element',
        tagName: 'div',
        properties: { 'data-v-callout-icon': true },
        children: [{ type: 'raw', value: icon } as unknown as Hast.ElementContent],
      }

      node.children.unshift(iconWrapper)
    })
  }
}

// Create the unified processor once
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkGitHubCallouts)
  .use(remarkRehype, { allowDangerousHtml: true })
  // Add `id`s to headings so the outline (which scans `[data-v-content]
  // :is(h2..h6)[id]`) and heading anchors work on guide/trait pages and on
  // rendered spec descriptions, matching the MDX pipeline.
  .use(rehypeSlug)
  .use(rehypeVocsAttrs)
  .use(rehypeTableWrapper)
  .use(rehypeCalloutIcons)
  .use(rehypeStringify, { allowDangerousHtml: true })

/**
 * Converts markdown to HTML string with GFM support (tables, autolinks, etc).
 */
export function toHtml(markdown: string): string {
  if (!markdown) return ''
  return processor.processSync(markdown).toString()
}

/**
 * Lazily loads the MDX/frontmatter parser stack used by {@link toText}.
 *
 * These packages (`remark-frontmatter`, `remark-mdx`, `remark-directive`,
 * `mdast-util-to-string`) are heavy and, in `remark-frontmatter`'s case, drag in
 * CJS-only transitive deps (`micromark-extension-frontmatter` → `fault` →
 * `format`) that break when bundled into a browser graph. `toHtml` — which is
 * imported by client components like `<Cards>` — must never pull them in, so
 * they're loaded on demand here (and only ever on the server / during indexing)
 * instead of at the top of this module.
 */
async function loadTextDeps() {
  const [remarkDirective, remarkFrontmatter, remarkMdx, mdastToString] = await Promise.all([
    import('remark-directive').then((m) => m.default),
    import('remark-frontmatter').then((m) => m.default),
    import('remark-mdx').then((m) => m.default),
    import('mdast-util-to-string').then((m) => m.toString),
  ])
  return { mdastToString, remarkDirective, remarkFrontmatter, remarkMdx }
}

/**
 * Reduces a Markdown/MDX string to plain text suitable for search indexing and
 * embedding.
 *
 * Parses the source into an MDAST (frontmatter, GFM, directives, MDX) and
 * serializes it with `mdast-util-to-string`, so only human-readable words
 * remain — no regex guesswork. Shared by the OpenAPI search index and external
 * AI search sources.
 *
 * Async because it lazily loads the MDX/frontmatter parser stack (see
 * {@link loadTextDeps}) rather than importing it at module scope, which would
 * leak heavy server-only deps into any client that imports {@link toHtml}.
 */
export async function toText(markdown: string | undefined): Promise<string> {
  if (!markdown) return ''

  const deps = await loadTextDeps()

  // MDX first (handles JSX in the site's own docs); fall back to plain
  // CommonMark for external sources whose `.md` isn't valid MDX.
  const tree = parseToText(markdown, true, deps) ?? parseToText(markdown, false, deps)
  if (!tree) return ''

  // Serialize per top-level block so adjacent blocks keep a word boundary
  // (mdast-util-to-string joins siblings without separators otherwise).
  return tree.children
    .map((node) => deps.mdastToString(node))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseToText(
  markdown: string,
  mdx: boolean,
  deps: Awaited<ReturnType<typeof loadTextDeps>>,
): Mdast.Root | undefined {
  try {
    const base = mdx ? unified().use(remarkParse).use(deps.remarkMdx) : unified().use(remarkParse)
    const proc = base
      .use(deps.remarkFrontmatter)
      .use(deps.remarkDirective)
      .use(remarkGfm)
      .use(stripFrontmatter)
      .use(stripJsx)
      .use(stripDirectives)

    const tree = proc.parse(markdown)
    proc.runSync(tree)
    return tree
  } catch {
    return undefined
  }
}

/** Removes YAML/TOML frontmatter nodes so their keys don't leak into text. */
function stripFrontmatter() {
  return (tree: Mdast.Root) => {
    visit(
      tree,
      (node) => node.type === 'yaml' || node.type === 'toml',
      (_node, index, parent) => {
        if (index === undefined || !parent) return
        parent.children.splice(index, 1)
        return index
      },
    )
  }
}

/** Unwraps or drops MDX JSX/ESM/expression nodes, keeping child text. */
function stripJsx() {
  return (tree: Mdast.Root) => {
    visit(
      tree,
      (node) =>
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement' ||
        node.type === 'mdxjsEsm' ||
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression',
      (node, index, parent) => {
        if (index === undefined || !parent) return
        if ('children' in node && Array.isArray(node.children)) {
          parent.children.splice(index, 1, ...(node.children as Mdast.RootContent[]))
          return index
        }
        parent.children.splice(index, 1)
        return index
      },
    )
  }
}

/** Unwraps directive nodes, keeping their child text. */
function stripDirectives() {
  return (tree: Mdast.Root) => {
    visit(
      tree,
      (node) =>
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective',
      (node, index, parent) => {
        if (index === undefined || !parent) return
        if ('children' in node && Array.isArray(node.children)) {
          parent.children.splice(index, 1, ...(node.children as Mdast.RootContent[]))
          return index
        }
        parent.children.splice(index, 1)
        return index
      },
    )
  }
}
