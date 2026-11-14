/**
 * `<Page />` renders saved pages: the site header, a sidebar when there is more than one page, the
 * current page, and its sources. The handler renders it on the server for permalinks, so its links
 * work without JavaScript. `<Docs />` shares its layout parts.
 * @module
 */
import type * as React from 'react'
import type { Client } from '../client/index.js'
import { Blocks } from './Blocks.js'
import { style, vars } from '../zyzz.config.js'

/** A saved page with its set's sidebar and sources. */
export function Page(props: Page.Props) {
  const current = props.saved.pages.find((page) => page.slug === props.slug) ?? props.saved.pages[0]
  return (
    <div data-view="page" data-vocs="docs" {...styles.docs({ className: props.className })}>
      <header data-vocs-part="header" {...styles.header()}>
        <a data-vocs-part="home-link" href={props.home ?? '/'} {...styles.homeLink()}>
          {props.title}
        </a>
      </header>
      <div
        data-layout={props.saved.pages.length > 1 ? 'sidebar' : 'single'}
        data-vocs-part="pages"
        {...styles.pages()}
      >
        {props.saved.pages.length > 1 && (
          <Sidebar current={current?.slug} href={props.href} pages={props.saved.pages} />
        )}
        <main data-vocs-part="main" {...styles.main()}>
          <article data-state="saved" data-vocs="page" {...styles.article()}>
            {current && (
              <>
                <h1 data-vocs-part="title" {...styles.pageTitle()}>
                  {current.title}
                </h1>
                <Blocks blocks={current.blocks} demos={props.demos} />
              </>
            )}
            <Sources files={props.saved.files} />
          </article>
        </main>
      </div>
    </div>
  )
}

export declare namespace Page {
  type Props = {
    className?: string | undefined
    /** Components that `demo` blocks may name. Each receives the props of its block. */
    demos?: Record<string, React.JSXElementConstructor<never>> | undefined
    /** Link of the site title. Defaults to `/`. */
    home?: string | undefined
    /** Returns the link of a page in the set, such as `/docs/pages/<id>/<slug>`. */
    href: (slug: string) => string
    /** The saved pages, from the handler. */
    saved: Client.Saved
    /** Slug of the page to show. Defaults to the first page. */
    slug?: string | undefined
    /** Site title. */
    title: string
  }
}

/** Page links in sidebar groups. `onSelect` handles a click in place of following the link. */
export function Sidebar(props: Sidebar.Props) {
  const groups = new Map<string, Sidebar.Props['pages'][number][]>()
  for (const page of props.pages) groups.set(page.group, [...(groups.get(page.group) ?? []), page])

  return (
    <nav aria-label="Pages" data-vocs="sidebar" {...styles.sidebar()}>
      {[...groups].map(([group, pages]) => (
        <section data-vocs-part="group" key={group} {...styles.group()}>
          <p data-vocs-part="group-title" {...styles.groupTitle()}>
            {group}
          </p>
          <ul {...styles.links()}>
            {pages.map((page) => (
              <li key={page.slug}>
                <a
                  aria-current={page.slug === props.current ? 'page' : undefined}
                  data-state={page.slug === props.current ? 'active' : 'inactive'}
                  data-vocs-part="link"
                  href={props.href(page.slug)}
                  onClick={
                    props.onSelect &&
                    ((event) => {
                      event.preventDefault()
                      props.onSelect?.(page.slug)
                    })
                  }
                  {...styles.link()}
                >
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export declare namespace Sidebar {
  type Props = {
    /** Slug of the current page. */
    current: string | undefined
    href: (slug: string) => string
    onSelect?: ((slug: string) => void) | undefined
    pages: readonly { group: string; slug: string; title: string }[]
  }
}

/** The corpus files the agent read, with links to their origins. */
export function Sources(props: { files: readonly Client.File[] }) {
  if (props.files.length === 0) return null
  return (
    <details data-vocs-part="sources" {...styles.sources()}>
      <summary>Sources</summary>
      <ul>
        {props.files.map((file) => (
          <li key={file.path}>{file.url ? <a href={file.url}>{file.path}</a> : file.path}</li>
        ))}
      </ul>
    </details>
  )
}

/** Layout styles that `<Docs />` shares. */
export namespace styles {
  export const article = style({
    '@layer vocs': {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginInline: 'auto',
      maxWidth: 'page',
      width: 'full',
    },
  })

  export const docs = style({
    '@layer vocs': {
      backgroundColor: vars.color.background,
      color: vars.color.foreground,
      colorScheme: 'light dark',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: vars.fontFamily.sans,
      minHeight: '100dvh !custom',
    },
  })

  export const group = style({
    '@layer vocs': { display: 'flex', flexDirection: 'column', gap: 1 },
  })

  export const groupTitle = style({
    '@layer vocs': { fontSize: 'sm', fontWeight: 600, margin: 0, paddingInline: 2 },
  })

  export const header = style({
    '@layer vocs': {
      alignItems: 'center',
      borderBlockEndColor: 'border',
      borderBlockEndStyle: 'solid',
      borderBlockEndWidth: '1px',
      display: 'flex',
      paddingBlock: 3,
      paddingInline: 4,
    },
  })

  export const homeLink = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
      textDecorationLine: 'none',
      borderWidth: 0,
      color: vars.color.foreground,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.sans,
      fontSize: 'md',
      fontWeight: 600,
      padding: 0,
    },
  })

  export const link = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
      display: 'block',
      textDecorationLine: 'none',
      borderRadius: vars.radius.sm,
      borderWidth: 0,
      color: vars.color.muted,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.sans,
      fontSize: 'sm',
      paddingBlock: 1,
      paddingInline: 2,
      textAlign: 'start',
      width: 'full',
      '&:hover': { color: vars.color.foreground },
      '&[data-state="active"]': {
        backgroundColor: vars.color.surface,
        color: vars.color.foreground,
      },
      '&:focus-visible': { outlineColor: 'accent', outlineStyle: 'solid', outlineWidth: '2px' },
    },
  })

  export const links = style({
    '@layer vocs': {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  })

  export const main = style({
    '@layer vocs': {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: 8,
      minWidth: 0,
      paddingBlock: 8,
      paddingInline: 6,
    },
  })

  export const pages = style({
    '@layer vocs': { display: 'flex', flex: 1 },
  })

  export const pageTitle = style({
    '@layer vocs': { fontSize: 'xl', fontWeight: 600, lineHeight: 1.2, margin: 0 },
  })

  export const sidebar = style({
    '@layer vocs': {
      borderInlineEndColor: 'border',
      borderInlineEndStyle: 'solid',
      borderInlineEndWidth: '1px',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      gap: 6,
      paddingBlock: 8,
      paddingInline: 4,
      width: 'sidebar',
    },
  })

  export const sources = style({
    '@layer vocs': { color: vars.color.muted, fontSize: 'sm' },
  })
}
