/**
 * External RAG sources for Vocs semantic search.
 *
 * `search.rag.sources` is a list of URLs. Each URL is fetched at build time and
 * embedded alongside the site's own docs. URLs are auto-expanded:
 *
 * - a `sitemap.xml` (or sitemap-index) → every `<loc>` page it lists
 * - an `llms.txt` → every page linked from it
 * - anything else → the page itself
 *
 * Sources are bounded: they never recursively follow in-page links. The URL set
 * comes entirely from the entrypoints you list. For live recursive crawling, use
 * a managed retriever (`search.retriever`) instead.
 *
 * External documents keep their absolute `href`, so search results link out (and
 * render the external-link icon in the search dialog).
 */

import * as Markdown from './markdown.js'

/**
 * An external RAG source. A bare string is shorthand for `{ url }`.
 *
 * `url` is a sitemap, `llms.txt`, or page URL (auto-expanded). `label` and
 * `weight` apply to every page the source expands to.
 */
export type Source = {
  /** Display label for results from this source. Defaults to the hostname. */
  label?: string | undefined
  /** Sitemap / `llms.txt` / page URL to fetch and embed. */
  url: string
  /**
   * Score multiplier for results from this source, relative to local docs
   * (which are `1`). External sources default to `0.9` — slightly
   * de-prioritized so your own docs win on comparable relevance.
   * @default 0.9
   */
  weight?: number | undefined
}

/** A document produced by an external RAG source. */
export type Document = {
  /** Absolute URL of the page (kept as-is so results link out). */
  href: string
  /** Display label inherited from the source (falls back to the hostname). */
  label: string | undefined
  /** Plain-text content to embed. */
  text: string
  /** Title of the page. */
  title: string
  /** Score multiplier inherited from the source. */
  weight: number | undefined
}

/** Options for {@link load}. */
export type LoadOptions = {
  /** Max concurrent fetches. @default 8 */
  concurrency?: number | undefined
  /** Called as each page finishes fetching, with the running/total counts. */
  onProgress?: ((done: number, total: number) => void) | undefined
  /** Optional abort signal to cancel in-flight requests. */
  signal?: AbortSignal | undefined
}

/**
 * Expands and fetches a list of source URLs into embeddable {@link Document}s.
 * Each URL is auto-detected (sitemap / llms.txt / page), expanded, fetched
 * concurrently, and reduced to plain text. Pages that fail to fetch or parse are
 * skipped with a warning rather than failing the whole build.
 */
export async function load(
  sources: readonly (string | Source)[],
  options: LoadOptions = {},
): Promise<Document[]> {
  if (sources.length === 0) return []
  const { concurrency = 8, onProgress, signal } = options

  const normalized = sources.map((source) =>
    typeof source === 'string' ? { url: source } : source,
  )

  // Expand each source into its page URLs, remembering the source each page came
  // from so its `label`/`weight` can be attached to the resulting documents.
  const expanded = await Promise.all(
    normalized.map(async (source) => {
      try {
        if (isSitemap(source.url))
          return { source, urls: await collectSitemapUrls(source.url, signal) }
        if (isLlmsTxt(source.url)) {
          const body = await fetchText(source.url, signal)
          return { source, urls: parseLlmsTxt(body, source.url) }
        }
        return { source, urls: [source.url] }
      } catch (error) {
        warn(source.url, error)
        return { source, urls: [] as string[] }
      }
    }),
  )

  // De-duplicate resolved page URLs; the first source that yields a URL owns it.
  const urls: string[] = []
  const meta = new Map<string, Source>()
  for (const { source, urls: pageUrls } of expanded) {
    for (const url of pageUrls) {
      if (meta.has(url)) continue
      meta.set(url, source)
      urls.push(url)
    }
  }

  return fetchDocuments(urls, { concurrency, meta, onProgress, signal })
}

function isSitemap(url: string): boolean {
  return /\.xml(\?|#|$)/i.test(url) || /\/sitemap[^/]*$/i.test(url)
}

function isLlmsTxt(url: string): boolean {
  return /\/llms(-full)?\.txt(\?|#|$)/i.test(url)
}

/** Fetches a list of URLs concurrently and extracts a {@link Document} from each. */
async function fetchDocuments(
  urls: readonly string[],
  options: {
    concurrency: number
    meta: Map<string, Source>
    onProgress: ((done: number, total: number) => void) | undefined
    signal: AbortSignal | undefined
  },
): Promise<Document[]> {
  const documents: Document[] = []
  const queue = [...urls]
  const total = queue.length
  const workerCount = Math.max(1, Math.min(options.concurrency, total))
  let done = 0

  async function worker(): Promise<void> {
    for (;;) {
      const next = queue.shift()
      if (next === undefined) return
      try {
        const body = await fetchText(next, options.signal)
        const doc = extractDocument(next, body, options.meta.get(next))
        if (doc.text.trim()) documents.push(doc)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        warn(next, error)
      } finally {
        done += 1
        options.onProgress?.(done, total)
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return documents
}

function warn(url: string, error: unknown): void {
  console.warn(
    `[vocs] RagSource: skipped ${url}: ${error instanceof Error ? error.message : String(error)}`,
  )
}

async function fetchText(target: string, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetch(target, {
    headers: { 'User-Agent': 'vocs-rag' },
    signal: signal ?? null,
  })
  if (!response.ok) throw new Error(`fetch failed (${response.status})`)
  return response.text()
}

/** Collects `<loc>` URLs from a sitemap, recursing one level into indexes. */
async function collectSitemapUrls(
  target: string,
  signal: AbortSignal | undefined,
): Promise<string[]> {
  const xml = await fetchText(target, signal)
  const locs = parseSitemapLocs(xml)
  const isIndex = /<sitemapindex[\s>]/i.test(xml)
  if (!isIndex) return locs

  const nested = await Promise.all(
    locs.map((loc) =>
      fetchText(loc, signal)
        .then(parseSitemapLocs)
        .catch(() => []),
    ),
  )
  return nested.flat()
}

/** Extracts `<loc>` values from sitemap XML. */
export function parseSitemapLocs(xml: string): string[] {
  const out: string[] = []
  const regex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi
  let match: RegExpExecArray | null = regex.exec(xml)
  while (match) {
    if (match[1]) out.push(decodeEntities(match[1].trim()))
    match = regex.exec(xml)
  }
  return out
}

/** Extracts link URLs from an `llms.txt` file (Markdown links + bare URLs). */
export function parseLlmsTxt(text: string, baseUrl: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (raw: string) => {
    const resolved = resolveUrl(raw, baseUrl)
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      out.push(resolved)
    }
  }

  // Markdown links: [text](url)
  const linkRegex = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let match: RegExpExecArray | null = linkRegex.exec(text)
  while (match) {
    if (match[1]) add(match[1])
    match = linkRegex.exec(text)
  }

  // Bare URLs on their own (not already captured as markdown links).
  const bareRegex = /(?<!\]\()\bhttps?:\/\/[^\s)<>"']+/g
  match = bareRegex.exec(text)
  while (match) {
    add(match[0])
    match = bareRegex.exec(text)
  }

  return out
}

function resolveUrl(raw: string, baseUrl: string): string | undefined {
  try {
    return new URL(raw, baseUrl).href
  } catch {
    return undefined
  }
}

/** Turns a fetched page (HTML, Markdown, or text) into a {@link Document}. */
export function extractDocument(pageUrl: string, body: string, source?: Source): Document {
  // Link to the rendered page, not the raw source: `llms.txt` files often point
  // at `.md`/`.mdx` files, but the human-facing page lives at the extensionless
  // path. We still fetch from `pageUrl` — only the stored `href` is cleaned.
  const href = stripDocExtension(pageUrl)
  const label = source?.label
  const weight = source?.weight
  const looksHtml = /<\s*(?:html|body|main|article|div|head|!doctype)[\s>]/i.test(body)
  if (looksHtml) {
    const { title, text } = htmlToText(body)
    return { href, label, text, title: title || titleFromUrl(pageUrl), weight }
  }
  // Markdown / plain text: strip frontmatter + Markdown syntax to plain text
  // (the same helper the OpenAPI search index uses), taking the first ATX
  // heading as the title.
  const heading = body.match(/^#{1,3}\s+(.+?)\s*$/m)?.[1]
  return {
    href,
    label,
    text: Markdown.toText(body),
    title: heading?.trim() || titleFromUrl(pageUrl),
    weight,
  }
}

/** Removes a trailing `.md`/`.mdx` from a URL's path, preserving query/hash. */
export function stripDocExtension(pageUrl: string): string {
  try {
    const url = new URL(pageUrl)
    url.pathname = url.pathname.replace(/\.mdx?$/i, '')
    return url.href
  } catch {
    return pageUrl.replace(/\.mdx?($|[?#])/i, '$1')
  }
}

/** Strips boilerplate from HTML and returns the main text + a title. */
function htmlToText(html: string): { title: string; text: string } {
  const title =
    stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '') ||
    stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')

  // Prefer the main content region when present.
  const main =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html

  const cleaned = main
    // Drop non-content and chrome elements entirely.
    .replace(
      /<(script|style|noscript|svg|template|head|nav|header|footer|aside)[\s\S]*?<\/\1>/gi,
      ' ',
    )
    .replace(/<!--[\s\S]*?-->/g, ' ')

  return { title: title.trim(), text: stripTags(cleaned) }
}

/** Removes tags, decodes entities, and collapses whitespace. */
function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*\n\s*/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
}

const namedEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return namedEntities[entity.toLowerCase()] ?? whole
  })
}

/** Derives a human-readable title from a URL path (last segment, humanized). */
function titleFromUrl(pageUrl: string): string {
  try {
    const { pathname, hostname } = new URL(pageUrl)
    const last = pathname.split('/').filter(Boolean).at(-1)
    if (!last) return hostname
    return last
      .replace(/\.(html?|md|txt)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return pageUrl
  }
}
