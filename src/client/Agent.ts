/**
 * The nanocode agent in the page. `Client` imports this module on the first question, so the
 * WebAssembly modules, the agent settings, and the corpus load only when a reader asks. One agent holds one session,
 * so later questions see earlier answers. The shell mounts corpus files at `/sources/`.
 * @module
 */
// oxlint-disable-next-line typescript/triple-slash-reference -- zile compiles only the entry graph, which an ambient declaration joins through a reference.
/// <reference path="./wasm.d.ts" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { AgentRuntime, Contracts } from 'nanocode-ts'
import { Bash } from 'nanocode-ts/bash'
import wasm from 'nanocode-ts/nanocode_wasm.wasm?url'
import type * as Corpus from '../internal/Corpus.js'
import type * as Handler from '../server/Handler.js'

/** A loaded agent. */
export type Agent = {
  /** Runs one question to completion, reporting progress through `handlers`. */
  ask(prompt: string, handlers: Handlers): Promise<void>
  /** Cancels the running question. */
  cancel(): Promise<void>
  /** The loaded corpus. */
  corpus: Corpus.Corpus
}

/** Progress callbacks of one question. */
export type Handlers = {
  delta(text: string): void
  /** A tool call started. */
  toolCall(): void
  /** A tool call returned. `output` holds its shell commands and their output. */
  toolResult(output: string): void
}

const scope = 'page'

/** Loads the corpus and both WebAssembly modules, and opens the session. */
export async function load(options: load.Options): Promise<Agent> {
  const [[settings, corpus], module, sqlite3] = await Promise.all([
    json<Handler.Agent>(options, `${options.basePath}/agent`).then(
      async (settings) => [settings, await json<Corpus.Corpus>(options, settings.corpus)] as const,
    ),
    WebAssembly.compileStreaming(options.fetch(wasm)),
    sqlite3InitModule(),
  ])
  const bash = await Bash.create({ files: corpus.files })

  const database = new sqlite3.oo1.DB(':memory:', 'c')
  const sql: Contracts.SqlHost = {
    transaction(_kind, _operation, statements) {
      database.exec('BEGIN IMMEDIATE')
      try {
        const rows = statements.map(
          (statement) =>
            database.exec({
              bind: statement.slice(1) as never,
              returnValue: 'resultRows',
              rowMode: 'array',
              sql: statement[0],
            }) as Contracts.SqlValue[][],
        )
        database.exec('COMMIT')
        return rows
      } catch (error) {
        database.exec('ROLLBACK')
        throw error
      }
    },
  }

  let handlers: Handlers | undefined
  // Shell commands run inside Code Mode cells. A cell's commands and their output are reported
  // together when the cell, a call without `parent_call_id`, returns.
  const cells = new Map<string, string[]>()
  const runtime = await AgentRuntime.instantiate(module, sql, {
    published(events) {
      for (const entry of events) {
        const logged = entry.event as {
          event?: { payload?: Record<string, unknown>; type?: string }
          source?: string
        }
        if (logged.source !== 'agent' || !logged.event || !handlers) continue
        const payload = logged.event.payload ?? {}
        const id = String(payload.call_id ?? '')
        if (logged.event.type === 'assistant.delta') handlers.delta(String(payload.text ?? ''))
        if (logged.event.type === 'tool.call') {
          const parent = payload.parent_call_id
          if (typeof parent === 'string') cells.get(parent)?.push(JSON.stringify(payload.arguments))
          else {
            cells.set(id, [])
            handlers.toolCall()
          }
        }
        if (logged.event.type === 'tool.result') {
          const cell = cells.get(id)
          const output = text(payload.result)
          if (!cell) {
            // A nested result names its cell only through its call ID, `<cell>/<n>`.
            cells.get(id.slice(0, id.lastIndexOf('/')))?.push(output)
            continue
          }
          cells.delete(id)
          handlers.toolResult([...cell, output].join('\n'))
        }
      }
    },
  })

  await runtime.open(
    {
      code_mode: true,
      endpoint: `${location.origin}${options.basePath}/model`,
      event_coalesce_ms: 50,
      instructions: instructions(settings),
      model: settings.model ?? '',
      provider: 'codex',
      scope,
      session_id: Contracts.sessionUuid(),
      subagents: false,
      subscription: false,
      thinking: 'low',
      web_search: false,
      workspace: bash.cwd,
      workspace_tools: 'all',
    },
    {
      dispatch: (request, signal) =>
        options.fetch(request.endpoint, {
          body: request.body as Uint8Array<ArrayBuffer>,
          headers: request.headers,
          method: 'POST',
          redirect: 'error',
          signal,
        }),
      workspace: bash.workspace(),
    },
  )

  let running: string | undefined

  return {
    async ask(prompt, next) {
      handlers = next
      const request_id = crypto.randomUUID()
      running = request_id
      try {
        await runtime.submit(scope, { metadata: {}, prompt, request_id })
        for (;;) {
          const pending = (await runtime.pending(scope))[0]
          if (!pending) break
          const driven = await runtime.drive(pending.report.request_id)
          if (driven.retry)
            throw new Error('The agent session ended. Reload the page and ask again.')
          if (driven.waiting) await new Promise((resolve) => setTimeout(resolve, 250))
        }
        const turn = await runtime.turn(scope, request_id)
        if (turn?.report.status === 'failed')
          throw new Error('The agent could not answer. Ask again.')
      } finally {
        running = undefined
        handlers = undefined
      }
    },
    async cancel() {
      if (running) await runtime.cancel(scope, running, {})
    },
    corpus,
  }
}

export declare namespace load {
  type Options = {
    /** Handler base path, such as `/docs`. */
    basePath: string
    /** Fetch used for the corpus, the module, and model requests. */
    fetch: typeof fetch
  }
}

async function json<value>(options: load.Options, url: string): Promise<value> {
  const response = await options.fetch(url)
  if (!response.ok) throw new Error(`${url} failed to load (HTTP ${response.status}).`)
  return (await response.json()) as value
}

/** Returns the text of a tool result, which is a string or a list of text parts. */
function text(result: unknown): string {
  if (typeof result === 'string') return result
  if (!Array.isArray(result)) return ''
  return result.map((part: { text?: unknown }) => String(part.text ?? '')).join('')
}

function instructions(settings: Handler.Agent) {
  return [
    `You answer questions about ${settings.title}${settings.description ? `: ${settings.description}` : ''}.`,
    'The documentation sources are files under /sources. Search them with `rg` and read them with `cat` before you answer.',
    'Answer only from those files. Name the file paths you used. If the files do not answer the question, say so.',
  ].join('\n')
}
