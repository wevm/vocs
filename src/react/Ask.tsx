'use client'
/**
 * `<Ask />` renders a prompt box and the conversation below it, on a `vocs/client` client.
 * Each element carries `data-vocs` names and enumerated `data-state` values for styling.
 * @module
 */
import * as React from 'react'
import { Client } from '../client/index.js'

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
function Message(props: Message.Props) {
  const state = React.useSyncExternalStore(props.turn.subscribe, props.turn.get, props.turn.get)
  return (
    <article
      aria-busy={!['cancelled', 'done', 'failed'].includes(state.status)}
      data-vocs="message"
      data-state={state.status}
    >
      <p data-vocs-part="prompt">{props.turn.prompt}</p>
      <div aria-live="polite" data-vocs-part="answer">
        {state.status === 'failed' ? state.error : state.text}
      </div>
      {state.files.length > 0 && (
        <ul data-vocs-part="files">
          {state.files.map((file) => (
            <li key={file.path}>{file.url ? <a href={file.url}>{file.path}</a> : file.path}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

declare namespace Message {
  type Props = { turn: Client.Turn }
}
