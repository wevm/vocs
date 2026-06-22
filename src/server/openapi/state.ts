import * as Config from '../../internal/config.js'
import * as ConfigSerializer from '../../internal/config-serializer.js'
import type { Payload } from '../../internal/openapi/app.js'
import type * as OpenApi from '../../internal/openapi/openapi.js'
import { parse } from '../../internal/openapi/parser.js'
import * as Sidebar from '../../internal/openapi/sidebar.js'
import * as Pages from './pages.js'

/**
 * Parses the configured spec, compiles override/guide pages, and synthesizes a
 * Vocs config — everything the static browser bundle needs to render the real
 * Vocs layout for the API reference.
 *
 * The sidebar mirrors the site integration: optional `sidebar.top` items, the
 * generated `Introduction` + per-category items, then optional `sidebar.bottom`
 * items.
 */
export async function prepare(
  config: OpenApi.Config,
  options: prepare.Options = {},
): Promise<Payload> {
  const { rootDir } = options

  const [ir, configPages] = await Promise.all([
    parse(config, { rootDir }),
    Pages.compile(config.pages, { rootDir }),
  ])

  // Doc-only `x-traitTag` tags become guide pages. By default they nest under
  // `Introduction`; an `x-parent` (group name) places them under that operation
  // group instead, or under a new sidebar group when the name has no operations.
  const traitPages = Pages.compileTraits(ir.traits)
  const pages = [...traitPages, ...configPages]

  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')
  const item = (trait: (typeof ir.traits)[number]) => ({
    text: trait.name,
    link: `${base}/${trait.id}`,
  })

  const groupIdByName = new Map(ir.groups.map((group) => [group.name, group.id]))
  const traitIntro: { text: string; link: string }[] = []
  const groupExtras = new Map<string, { text: string; link: string }[]>()
  const extraGroups = new Map<string, { text: string; link: string }[]>()
  for (const trait of ir.traits) {
    if (!trait.parent) {
      traitIntro.push(item(trait))
      continue
    }
    const groupId = groupIdByName.get(trait.parent)
    const bucket = groupId ? groupExtras : extraGroups
    const key = groupId ?? trait.parent
    bucket.set(key, [...(bucket.get(key) ?? []), item(trait)])
  }

  const top = config.sidebar?.top ?? []
  const bottom = config.sidebar?.bottom ?? []
  const intro = [...traitIntro, ...(config.sidebar?.intro ?? [])]
  const collapsed = config.sidebar?.collapsed ?? false
  const newGroups = [...extraGroups].map(([name, items]) => ({
    text: name,
    collapsed,
    items,
  }))
  const sidebar = [
    ...top,
    ...Sidebar.toSidebar(ir, { intro, groupExtras, collapsed }),
    ...newGroups,
    ...bottom,
  ]

  // A real Vocs config so the browser bundle renders the genuine layout/chrome.
  // `sidebar` is an array (covers the whole section, no path-scoping needed).
  const vocsConfig = Config.define({
    title: ir.info.title,
    description: ir.info.description,
    rootDir,
    sidebar,
    ...config.vocs,
  })

  return {
    ir,
    // `vocs.title` overrides the spec title (used for the HTML shell `<title>`).
    title: vocsConfig.title ?? ir.info.title,
    sidebar,
    pages,
    // Serialize functions (e.g. search/feedback adapters) so they survive the
    // JSON embed; the browser deserializes via `virtual:vocs/config`.
    config: ConfigSerializer.serializeFunctions(vocsConfig),
  }
}

export declare namespace prepare {
  type Options = {
    /** Directory file-path specs/pages are resolved against. */
    rootDir?: string | undefined
  }
}

/**
 * Resolves consumer-supplied custom CSS for the shell `<head>`: an inline
 * string is returned as-is, while `{ file }` is read once from disk (resolved
 * against `rootDir`). Returns `undefined` when no CSS is configured.
 *
 * Only touches the filesystem when a `file` is configured, so inline-string CSS
 * works on runtimes without `node:fs` (e.g. Cloudflare Workers).
 */
export async function resolveCss(
  css: string | { file: string } | undefined,
  options: resolveCss.Options = {},
): Promise<string | undefined> {
  if (css === undefined) return undefined
  if (typeof css === 'string') return css

  const { rootDir = typeof process !== 'undefined' ? process.cwd() : '.' } = options
  const [{ default: fs }, path] = await Promise.all([
    import('node:fs/promises').then((module) => ({ default: module })),
    import('node:path'),
  ])
  const filePath = path.isAbsolute(css.file) ? css.file : path.resolve(rootDir, css.file)
  return fs.readFile(filePath, 'utf-8')
}

export declare namespace resolveCss {
  type Options = {
    /** Directory `file` paths are resolved against. @default process.cwd() */
    rootDir?: string | undefined
  }
}
