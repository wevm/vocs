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

  const [ir, pages] = await Promise.all([
    parse(config, { rootDir }),
    Pages.compile(config.pages, { rootDir }),
  ])

  const top = config.sidebar?.top ?? []
  const bottom = config.sidebar?.bottom ?? []
  const sidebar = [...top, ...Sidebar.toSidebar(ir), ...bottom]

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
