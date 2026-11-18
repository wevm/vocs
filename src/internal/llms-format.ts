/**
 * Pure `llms.txt` and `llms-full.txt` formatters. Workers-safe: they take the pages and a runtime
 * `origin` (such as a preview deploy's URL) and return text, so a server can build both files per
 * request while the Vocs build writes the same format.
 */
import * as Negotiation from './negotiation.js'

/**
 * Returns `llms.txt`: the site title, its description, and a link to each page's Markdown.
 *
 * @example
 * ```ts
 * Llms.index({
 *   origin: 'https://example.com',
 *   title: 'Example',
 *   pages: [{ path: '/guide', title: 'Guide', description: 'Get started.' }],
 * })
 * // # Example
 * //
 * // - [Guide](https://example.com/guide.md): Get started.
 * ```
 */
export function index(options: index.Options): string {
  return [...header(options), ...links(options)].join('\n')
}

export declare namespace index {
  type Options = {
    /** Site description, under the title. */
    description?: string | undefined
    /** Prefix of every link, such as `https://example.com`. @default '' (root-relative links) */
    origin?: string | undefined
    /** Pages in the order to list them. */
    pages: readonly Page[]
    /** Markdown between the description and the page links, such as a `## Pages` heading. */
    preamble?: string | undefined
    /** Site title, the document's heading. */
    title: string
  }

  type Page = {
    description?: string | undefined
    /** Page route, such as `/guide` or `/` for the home page. */
    path: string
    title: string
  }
}

/**
 * Returns `llms-full.txt`: the index (by default the title, description, and page links in a
 * comment), followed by each page's Markdown under its source URL.
 */
export function full(options: full.Options): string {
  const { origin = '', pages } = options
  const head =
    options.index !== undefined
      ? [options.index, '']
      : [...header(options), ['<!--', 'Sitemap:', ...links(options), '-->', ''].join('\n')]
  return [
    ...head,
    ...pages.map((page) => `<!-- Source: ${origin}${page.path} -->\n\n${page.content}`),
  ].join('\n')
}

export declare namespace full {
  type Options = Omit<index.Options, 'pages'> & {
    /** Replaces the generated heading and page list, such as a transformed `llms.txt`. */
    index?: string | undefined
    pages: readonly Page[]
  }

  type Page = index.Page & {
    /** The page's Markdown. */
    content: string
  }
}

function header(options: index.Options) {
  const lines = [`# ${options.title}`, '']
  if (options.description) lines.push(options.description, '')
  if (options.preamble) lines.push(options.preamble.trim(), '')
  return lines
}

function links(options: index.Options) {
  const { origin = '' } = options
  return options.pages.map(
    ({ description, path, title }) =>
      `- [${escapeLabel(title)}](${origin}${Negotiation.path(path)})${description ? `: ${description.replace(/\s+/g, ' ').trim()}` : ''}`,
  )
}

function escapeLabel(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[\\[\]]/g, '\\$&')
    .trim()
}
