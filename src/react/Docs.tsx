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
import { Sidebar, Sources, styles as layout } from './Page.js'
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
    <div data-view={view} data-vocs="docs" {...layout.docs({ className: props.className })}>
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
          <header data-vocs-part="header" {...layout.header()}>
            <button
              data-vocs-part="home-link"
              onClick={() => setView('home')}
              type="button"
              {...layout.homeLink()}
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
    /** Components that `demo` blocks may name. Each receives the props of its block. */
    demos?: Record<string, React.JSXElementConstructor<never>> | undefined
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

  return (
    <div
      data-layout={state.pages.length > 1 ? 'sidebar' : 'single'}
      data-vocs-part="pages"
      {...layout.pages()}
    >
      {state.pages.length > 1 && (
        <Sidebar
          current={page?.slug}
          href={(slug) => `#${slug}`}
          onSelect={setSelected}
          pages={state.pages}
        />
      )}
      <main data-vocs-part="main" {...layout.main()}>
        <article data-state={state.status} data-vocs="page" {...layout.article()}>
          {page ? (
            <>
              <h1 data-vocs-part="title" {...layout.pageTitle()}>
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
          {state.status === 'saved' ? (
            <a data-vocs-part="permalink" href={state.link} {...styles.action()}>
              Open permalink
            </a>
          ) : (
            (state.save === 'available' || state.status === 'saving') && (
              <button
                data-state={state.status === 'saving' ? 'saving' : 'idle'}
                data-vocs-part="save"
                disabled={state.status === 'saving'}
                onClick={props.guide.save}
                type="button"
                {...styles.action()}
              >
                {state.status === 'saving' ? 'Saving' : 'Save'}
              </button>
            )
          )}
          <Sources files={state.files} />
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
  if (state.status === 'saveFailed') return state.error ?? 'The pages failed to save.'
  return ''
}

namespace styles {
  export const action = style({
    '@layer vocs': {
      alignSelf: 'flex-start',
      backgroundColor: vars.color.background,
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      color: vars.color.foreground,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.sans,
      fontSize: 'sm',
      paddingBlock: 1,
      paddingInline: 3,
      textDecorationLine: 'none',
      '&:hover': { backgroundColor: vars.color.surface },
      '&:disabled': { color: vars.color.muted, cursor: 'default' },
      '&:focus-visible': { outlineColor: 'accent', outlineStyle: 'solid', outlineWidth: '2px' },
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

  export const homeTitle = style({
    '@layer vocs': { fontSize: 'xl', fontWeight: 600, margin: 0, textAlign: 'center' },
  })

  export const lead = style({
    '@layer vocs': { color: vars.color.muted, fontSize: 'lg', margin: 0, textAlign: 'center' },
  })

  export const messages = style({
    '@layer vocs': { display: 'flex', flexDirection: 'column', gap: 6 },
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
