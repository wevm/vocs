'use client'
/**
 * `<Docs />` is the reader's documentation app. The home view is a composer. A chat prompt opens
 * the conversation, and a page or docs prompt opens the generated pages, with a sidebar when there
 * is more than one page. The composer under the pages revises them.
 * @module
 */
import * as React from 'react'
import { Client } from '../client/index.js'
import { Message } from './Ask.js'
import { Blocks } from './Blocks.js'
import { Composer } from './Composer.js'
import { style, vars } from '../zyzz.config.js'

/** The documentation app: composer, chat, and generated pages. */
export function Docs(props: Docs.Props) {
  const [client] = React.useState(() => Client.create({ basePath: props.basePath }))
  const [view, setView] = React.useState<'chat' | 'guide' | 'home'>('home')
  const [turns, setTurns] = React.useState<readonly Client.Turn[]>([])
  const [guide, setGuide] = React.useState<Client.Guide>()

  function submit(prompt: string, mode: Composer.Mode) {
    if (mode === 'chat') {
      setTurns((current) => [...current, client.ask(prompt)])
      setView('chat')
      return
    }
    setGuide(client.generate(prompt, { mode }))
    setView('guide')
  }

  return (
    <div data-view={view} data-vocs="docs" {...styles.docs({ className: props.className })}>
      {view === 'home' ? (
        <main data-vocs-part="home" {...styles.home()}>
          <h1 data-vocs-part="title" {...styles.homeTitle()}>
            {props.title}
          </h1>
          <p data-vocs-part="lead" {...styles.lead()}>
            {props.lead ?? 'What do you want to learn?'}
          </p>
          <Composer
            label="What do you want to learn?"
            onSubmit={submit}
            placeholder={props.placeholder ?? 'Ask anything, or describe the page you need'}
          />
        </main>
      ) : (
        <>
          <header data-vocs-part="header" {...styles.header()}>
            <button
              data-vocs-part="home-link"
              onClick={() => setView('home')}
              type="button"
              {...styles.homeLink()}
            >
              {props.title}
            </button>
          </header>
          {view === 'chat' && (
            <main data-vocs-part="chat" {...styles.chat()}>
              <div data-vocs-part="messages" {...styles.messages()}>
                {turns.map((turn, index) => (
                  <Message key={index} turn={turn} />
                ))}
              </div>
              <Composer label="Ask a follow-up" onSubmit={submit} {...styles.docked()} />
            </main>
          )}
          {view === 'guide' && guide && (
            <Pages demos={props.demos} guide={guide} key={guide.prompt} />
          )}
        </>
      )}
    </div>
  )
}

export declare namespace Docs {
  type Props = {
    /** Path where the handler is mounted. Defaults to `/docs`. */
    basePath?: string | undefined
    className?: string | undefined
    /** Components that `demo` blocks may name. */
    demos?: Record<string, React.ComponentType> | undefined
    /** Line under the title. Defaults to "What do you want to learn?". */
    lead?: string | undefined
    placeholder?: string | undefined
    /** Site title. */
    title: string
  }
}

/** Generated pages: a sidebar when there is more than one, the selected page, and a reviser. */
function Pages(props: { demos: Docs.Props['demos']; guide: Client.Guide }) {
  const state = React.useSyncExternalStore(props.guide.subscribe, props.guide.get, props.guide.get)
  const [selected, setSelected] = React.useState<string>()
  const page = state.pages.find((entry) => entry.slug === selected) ?? state.pages[0]
  const groups = React.useMemo(() => {
    const map = new Map<string, Client.Guide.Page[]>()
    for (const entry of state.pages) map.set(entry.group, [...(map.get(entry.group) ?? []), entry])
    return [...map]
  }, [state.pages])

  return (
    <div
      data-layout={state.pages.length > 1 ? 'sidebar' : 'single'}
      data-vocs-part="pages"
      {...styles.pages()}
    >
      {state.pages.length > 1 && (
        <nav aria-label="Pages" data-vocs="sidebar" {...styles.sidebar()}>
          {groups.map(([group, entries]) => (
            <section data-vocs-part="group" key={group} {...styles.group()}>
              <p data-vocs-part="group-title" {...styles.groupTitle()}>
                {group}
              </p>
              <ul {...styles.links()}>
                {entries.map((entry) => (
                  <li key={entry.slug}>
                    <button
                      aria-current={entry.slug === page?.slug ? 'page' : undefined}
                      data-state={entry.slug === page?.slug ? 'active' : 'inactive'}
                      data-vocs-part="link"
                      onClick={() => setSelected(entry.slug)}
                      type="button"
                      {...styles.link()}
                    >
                      {entry.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      )}
      <main data-vocs-part="main" {...styles.main()}>
        <article data-state={state.status} data-vocs="page" {...styles.article()}>
          {page ? (
            <>
              <h1 data-vocs-part="title" {...styles.pageTitle()}>
                {page.title}
              </h1>
              <Blocks blocks={page.blocks} demos={props.demos} />
            </>
          ) : (
            state.status !== 'failed' && (
              <p data-vocs-part="pending" {...styles.status()}>
                Searching the sources
              </p>
            )
          )}
          <p
            aria-live="polite"
            data-state={state.status}
            data-vocs-part="status"
            {...styles.status()}
          >
            {status(state)}
          </p>
          {state.files.length > 0 && (
            <details data-vocs-part="sources" {...styles.sources()}>
              <summary>Sources</summary>
              <ul>
                {state.files.map((file) => (
                  <li key={file.path}>
                    {file.url ? <a href={file.url}>{file.path}</a> : file.path}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
        <Composer
          label="Revise these pages"
          modes={['page']}
          onSubmit={(prompt) => props.guide.refine(prompt)}
          placeholder="Ask for a change, such as “use Express” or “shorter”"
          submitLabel="Revise"
          {...styles.docked()}
        />
      </main>
    </div>
  )
}

/** Returns the status line of generated pages. */
function status(state: Client.Guide.State): string {
  if (state.status === 'failed') return state.error ?? 'The pages failed.'
  if (state.status === 'cancelled') return 'Stopped.'
  if (state.status === 'generating') return 'Writing'
  if (state.status === 'refining') return 'Revising'
  return ''
}

namespace styles {
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

  export const chat = style({
    '@layer vocs': {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: 6,
      marginInline: 'auto',
      maxWidth: 'page',
      paddingBlock: 8,
      paddingInline: 4,
      width: 'full',
    },
  })

  export const docked = style({
    '@layer vocs': {
      insetBlockEnd: 4,
      marginBlockStart: 'auto',
      marginInline: 'auto',
      maxWidth: 'page',
      position: 'sticky',
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

  export const home = style({
    '@layer vocs': {
      alignItems: 'center',
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'center',
      marginInline: 'auto',
      maxWidth: 'page',
      paddingBlock: 16,
      paddingInline: 4,
      width: 'full',
    },
  })

  export const homeLink = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
      borderWidth: 0,
      color: vars.color.foreground,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.sans,
      fontSize: 'md',
      fontWeight: 600,
      padding: 0,
    },
  })

  export const homeTitle = style({
    '@layer vocs': { fontSize: 'xl', fontWeight: 600, margin: 0, textAlign: 'center' },
  })

  export const lead = style({
    '@layer vocs': { color: vars.color.muted, fontSize: 'lg', margin: 0, textAlign: 'center' },
  })

  export const link = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
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

  export const messages = style({
    '@layer vocs': { display: 'flex', flexDirection: 'column', gap: 6 },
  })

  export const pageTitle = style({
    '@layer vocs': { fontSize: 'xl', fontWeight: 600, lineHeight: 1.2, margin: 0 },
  })

  export const pages = style({
    '@layer vocs': { display: 'flex', flex: 1 },
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

  export const status = style({
    '@layer vocs': {
      color: vars.color.muted,
      fontSize: 'sm',
      margin: 0,
      '&:empty': { display: 'none' },
    },
  })
}
