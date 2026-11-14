/**
 * Renders the permalink of a saved page as a streamed HTML document. The document inlines the
 * default theme and one module that switches code tabs and copies code, and reads the same with
 * JavaScript off. A page with registered demos renders each one on the server as an island, and
 * links the module that hydrates them. Other pages load nothing else. The handler imports this
 * module on the first permalink.
 * @module
 */
import { renderToReadableStream } from 'react-dom/server'
import { Page } from '../react/Page.js'
import type * as Demos from './Demos.js'
import * as Enhance from './Enhance.js'
import type * as Saved from './Saved.js'
import * as Stylesheet from './Stylesheet.js'
import { style } from '../zyzz.config.js'

/** Returns the HTML document of one page of a saved set. */
export async function render(options: render.Options): Promise<ReadableStream<Uint8Array>> {
  const href = (slug: string) => `${options.basePath}/pages/${options.saved.id}/${slug}`
  const islands = await render.islands({ blocks: options.page.blocks, registry: options.demos })
  const demos = Object.fromEntries(
    islands.map((island) => [
      island.name,
      () => (
        <div
          dangerouslySetInnerHTML={{ __html: island.html ?? '' }}
          data-name={island.name}
          data-state={island.html === undefined ? 'empty' : 'static'}
          data-vocs-part="island"
        />
      ),
    ]),
  )
  return renderToReadableStream(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{`${options.page.title} · ${options.site.title}`}</title>
        {options.site.description && <meta content={options.site.description} name="description" />}
        <link href={href(options.page.slug)} rel="canonical" />
        <style dangerouslySetInnerHTML={{ __html: Stylesheet.css }} />
        {islands.length > 0 &&
          options.demos!.preload.map((url) => <link href={url} key={url} rel="modulepreload" />)}
      </head>
      <body {...styles.body()}>
        <Page
          demos={demos}
          href={href}
          saved={options.saved}
          slug={options.page.slug}
          title={options.site.title}
        />
        <script dangerouslySetInnerHTML={{ __html: Enhance.script }} type="module" />
        {islands.length > 0 && <script src={options.demos!.script} type="module" />}
      </body>
    </html>,
  )
}

export declare namespace render {
  type Options = {
    /** Path where the handler is mounted, such as `/docs`. */
    basePath: string
    /** The demos of the config, or `undefined` when it registers none. */
    demos: Demos.Registry | undefined
    /** The page to show. */
    page: Saved.Page
    saved: Saved.Saved
    site: { description: string | undefined; title: string }
  }
}

export namespace render {
  /**
   * Renders each registered demo that the blocks name to HTML, in parallel. Each demo renders as
   * its own React root, so the islands module hydrates it with matching markup and IDs. A demo that
   * fails to render has no HTML, and the islands module renders it in the browser.
   */
  export async function islands(options: islands.Options): Promise<readonly islands.Island[]> {
    if (!options.registry) return []
    const named = new Set(
      options.blocks.flatMap((block) => (block.type === 'demo' ? [block.name] : [])),
    )
    if (named.size === 0) return []

    const load = await options.registry.load()
    const names = [...named].filter((name) => Object.hasOwn(load, name))
    return Promise.all(
      names.map(async (name) => {
        const html = await (async () => {
          try {
            const Demo = (await load[name]!()).default
            const stream = await renderToReadableStream(<Demo />)
            await stream.allReady
            return await new Response(stream).text()
          } catch {
            // React reports the error through its default `onError`.
            return undefined
          }
        })()
        return { html, name }
      }),
    )
  }

  export declare namespace islands {
    type Island = {
      /** Server HTML of the demo, or `undefined` when its render failed. */
      html: string | undefined
      name: string
    }
    type Options = {
      blocks: Saved.Page['blocks']
      registry: Demos.Registry | undefined
    }
  }
}

namespace styles {
  export const body = style({ '@layer vocs': { margin: 0 } })
}
