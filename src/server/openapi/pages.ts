import * as Markdown from '../../internal/markdown.js'
import type { CompiledPage, PageBlock } from '../../internal/openapi/app.js'
import type * as OpenApi from '../../internal/openapi/openapi.js'
import { normalizePath } from '../../internal/openapi/openapi.js'

/**
 * Reads and compiles consumer-authored `.md`/`.mdx` override/guide pages for the
 * standalone handler into serializable {@link CompiledPage}s.
 *
 * The standalone handler has no filesystem router, so pages are supplied
 * explicitly via `config.pages`. Each file is read once at boot and split into
 * an ordered list of {@link PageBlock}s: prose is rendered to HTML with the same
 * `data-v` typography as the rest of the docs, while inline
 * `<OpenApi.Endpoints />` components become `endpoints` blocks re-hydrated as
 * real React on the client.
 *
 * MDX `import`/`export` statements are stripped (the only supported component is
 * `<OpenApi.Endpoints />`); anything else renders as Markdown.
 */
export async function compile(
  pages: OpenApi.Page[] | undefined,
  options: compile.Options = {},
): Promise<CompiledPage[]> {
  if (!pages || pages.length === 0) return []
  const { rootDir = typeof process !== 'undefined' ? process.cwd() : '.' } = options

  // Only touch the filesystem when a page actually needs a file read, so inline
  // `content` pages work on runtimes without `node:fs` (e.g. Cloudflare Workers).
  const needsFs = pages.some((page) => page.content === undefined && page.file !== undefined)
  const fsModule = needsFs
    ? await Promise.all([
        import('node:fs/promises').then((module) => ({ default: module })),
        import('node:path'),
      ])
    : undefined

  const compiled: CompiledPage[] = []
  for (const page of pages) {
    let source: string
    if (page.content !== undefined) source = page.content
    else if (page.file !== undefined && fsModule) {
      const [{ default: fs }, path] = fsModule
      const filePath = path.isAbsolute(page.file) ? page.file : path.resolve(rootDir, page.file)
      source = await fs.readFile(filePath, 'utf-8')
    } else throw new Error(`[vocs] Page "${page.path}" must define either \`file\` or \`content\`.`)

    const result = compileSource(page.path, source)
    compiled.push(page.title ? { ...result, title: page.title } : result)
  }
  return compiled
}

export declare namespace compile {
  type Options = {
    /** Directory `file` paths are resolved against. @default process.cwd() */
    rootDir?: string | undefined
  }
}

/** Matches a self-closing `<OpenApi.Endpoints ... />` or `<Endpoints ... />`. */
const endpointsRe = /<(?:OpenApi\.)?Endpoints\b([^>]*?)\/>/g
/** Matches an ESM `import`/`export` statement line. */
const esmLineRe = /^\s*(?:import|export)\b.*$/gm
/** Matches a leading YAML frontmatter block. */
const frontmatterRe = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Compiles a single page source string into a {@link CompiledPage}. */
export function compileSource(routePath: string, source: string): CompiledPage {
  const { body, title } = stripFrontmatter(source)

  const blocks: PageBlock[] = []
  let lastIndex = 0
  for (const match of body.matchAll(endpointsRe)) {
    const index = match.index ?? 0
    const before = body.slice(lastIndex, index)
    pushHtml(blocks, before)
    blocks.push({ type: 'endpoints', path: parsePath(match[1] ?? '') })
    lastIndex = index + match[0].length
  }
  pushHtml(blocks, body.slice(lastIndex))

  return {
    path: normalizePath(routePath),
    title: title ?? firstHeading(body),
    blocks,
  }
}

/** Renders a Markdown segment to an HTML block (ESM lines stripped). */
function pushHtml(blocks: PageBlock[], markdown: string): void {
  const cleaned = markdown.replace(esmLineRe, '').trim()
  if (!cleaned) return
  blocks.push({ type: 'html', html: Markdown.toHtml(cleaned) })
}

/** Extracts the `path="..."` attribute from an `<Endpoints>` tag, if present. */
function parsePath(attrs: string): string | undefined {
  const match = attrs.match(/\bpath\s*=\s*["']([^"']*)["']/)
  return match?.[1]
}

/** Splits a leading YAML frontmatter block, returning the body and `title`. */
function stripFrontmatter(source: string): { body: string; title?: string | undefined } {
  const match = source.match(frontmatterRe)
  if (!match) return { body: source }
  const title = match[1]
    ?.match(/^title\s*:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, '')
  return { body: source.slice(match[0].length), title }
}

/** Finds the first `# heading` in a Markdown body. */
function firstHeading(body: string): string | undefined {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim()
}
