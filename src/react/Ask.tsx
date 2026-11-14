'use client'
/**
 * `<Ask />` renders a prompt box and the conversation below it, on a `vocs/client` client.
 * Each element carries `data-vocs` names and enumerated `data-state` values for styling.
 * @module
 */
import * as React from 'react'
import { Client } from '../client/index.js'
import { styles as layout } from './Page.js'
import { style, vars } from '../zyzz.config.js'

/** A prompt box with streamed answers and the files each answer read. */
export function Ask(props: Ask.Props) {
  const [client] = React.useState(() => Client.create({ basePath: props.basePath }))
  const [turns, setTurns] = React.useState<readonly Client.Turn[]>([])
  const status = React.useSyncExternalStore(
    client.agent.subscribe,
    client.agent.get,
    client.agent.get,
  )

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const prompt = String(new FormData(form).get('prompt') ?? '').trim()
    if (!prompt) return
    setTurns((current) => [...current, client.ask(prompt)])
    form.reset()
  }

  return (
    <section className={props.className} data-vocs="ask" data-state={status}>
      <div data-vocs-part="messages">
        {turns.map((turn, index) => (
          <Message key={index} turn={turn} />
        ))}
      </div>
      <form data-vocs-part="form" onSubmit={submit}>
        <label data-vocs-part="label" htmlFor="vocs-prompt">
          {props.label ?? 'Ask a question'}
        </label>
        <input
          autoComplete="off"
          data-vocs-part="input"
          id="vocs-prompt"
          name="prompt"
          placeholder={props.placeholder}
          required
        />
        <button data-vocs-part="submit" type="submit">
          Ask
        </button>
      </form>
    </section>
  )
}

export declare namespace Ask {
  type Props = {
    /** Path where the handler is mounted. Defaults to `/docs`. */
    basePath?: string | undefined
    className?: string | undefined
    /** Visible label of the prompt box. Defaults to "Ask a question". */
    label?: string | undefined
    placeholder?: string | undefined
  }
}

/** One question and its streaming answer. */
export function Message(props: Message.Props) {
  const state = React.useSyncExternalStore(props.turn.subscribe, props.turn.get, props.turn.get)
  return (
    <article
      aria-busy={!['cancelled', 'done', 'failed'].includes(state.status)}
      data-vocs="message"
      data-state={state.status}
      {...styles.message()}
    >
      <p data-vocs-part="prompt" {...styles.prompt()}>
        {props.turn.prompt}
      </p>
      <div aria-live="polite" data-vocs-part="answer" {...styles.answer()}>
        {state.status === 'failed' ? state.error : state.text}
      </div>
      {state.files.length > 0 && (
        <ul data-vocs-part="files" {...styles.files()}>
          {state.files.map((file) => (
            <li key={file.path}>{file.url ? <a href={file.url}>{file.path}</a> : file.path}</li>
          ))}
        </ul>
      )}
      {props.onPage && state.status === 'done' && (
        <button
          data-vocs-part="page-action"
          onClick={props.onPage}
          type="button"
          {...layout.action()}
        >
          Make a page
        </button>
      )}
    </article>
  )
}

export declare namespace Message {
  type Props = {
    /** Called when the reader turns the finished answer into a page. Without it, no button shows. */
    onPage?: (() => void) | undefined
    turn: Client.Turn
  }
}

namespace styles {
  export const answer = style({
    '@layer vocs': { lineHeight: 1.6, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  })

  export const files = style({
    '@layer vocs': {
      color: vars.color.muted,
      fontSize: 'sm',
      margin: 0,
      overflowWrap: 'anywhere',
      paddingInlineStart: 4,
    },
  })

  export const message = style({
    '@layer vocs': { display: 'flex', flexDirection: 'column', gap: 3 },
  })

  export const prompt = style({
    '@layer vocs': {
      alignSelf: 'flex-end',
      backgroundColor: vars.color.surface,
      borderRadius: vars.radius.lg,
      margin: 0,
      maxWidth: '85% !custom',
      paddingBlock: 2,
      paddingInline: 3,
    },
  })
}
