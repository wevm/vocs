/**
 * Renders the permalink of a saved page as a streamed HTML document. The document inlines the
 * default theme and one module that switches code tabs and copies code, so it loads nothing else
 * and reads the same with JavaScript off. The handler imports this module on the first permalink.
 * @module
 */
import { renderToReadableStream } from 'react-dom/server'
import { Page } from '../react/Page.js'
import * as Enhance from './Enhance.js'
import type * as Saved from './Saved.js'
import * as Stylesheet from './Stylesheet.js'
import { style } from '../zyzz.config.js'

/** Returns the HTML document of one page of a saved set. */
export async function render(options: render.Options): Promise<ReadableStream<Uint8Array>> {
  const href = (slug: string) => `${options.basePath}/pages/${options.saved.id}/${slug}`
  return renderToReadableStream(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{`${options.page.title} · ${options.site.title}`}</title>
        {options.site.description && <meta content={options.site.description} name="description" />}
        <link href={href(options.page.slug)} rel="canonical" />
        <style dangerouslySetInnerHTML={{ __html: Stylesheet.css }} />
      </head>
      <body {...styles.body()}>
        <Page
          href={href}
          saved={options.saved}
          slug={options.page.slug}
          title={options.site.title}
        />
        <script dangerouslySetInnerHTML={{ __html: Enhance.script }} type="module" />
      </body>
    </html>,
  )
}

export declare namespace render {
  type Options = {
    /** Path where the handler is mounted, such as `/docs`. */
    basePath: string
    /** The page to show. */
    page: Saved.Page
    saved: Saved.Saved
    site: { description: string | undefined; title: string }
  }
}

namespace styles {
  export const body = style({ '@layer vocs': { margin: 0 } })
}
