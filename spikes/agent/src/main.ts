/**
 * Spike A page. It loads the corpus on page load and the agent on the first prompt, then runs
 * one nanocode turn over sqlite-wasm and a `nanocode-ts/bash` memory filesystem. Model requests
 * go to this page's Worker. Timings are written to `[data-vocs=metrics]` and `window.metrics`.
 * @module
 */
/// <reference types="vite/client" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { AgentRuntime, Contracts } from 'nanocode-ts'
import { Bash } from 'nanocode-ts/bash'
import wasm from 'nanocode-ts/nanocode_wasm.wasm?url'

const root = document.querySelector<HTMLElement>('[data-vocs=root]')!
const form = document.querySelector<HTMLFormElement>('[data-vocs=ask]')!
const status = document.querySelector<HTMLElement>('[data-vocs=status]')!
const answer = document.querySelector<HTMLElement>('[data-vocs=answer]')!
const list = document.querySelector<HTMLElement>('[data-vocs=metrics]')!

const metrics: Record<string, number> = {}
Object.assign(window, { metrics })

const corpus = (await (await fetch('/corpus.json')).json()) as Record<string, string>
metric('corpus.files', Object.keys(corpus).length)
root.dataset.state = 'ready'

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const prompt = String(new FormData(form).get('prompt') ?? '')
  root.dataset.state = 'running'
  answer.textContent = ''
  ask(prompt).then(
    () => {
      root.dataset.state = 'done'
    },
    (error: unknown) => {
      root.dataset.state = 'failed'
      status.textContent = error instanceof Error ? error.message : String(error)
    },
  )
})

async function ask(prompt: string) {
  const start = performance.now()

  status.textContent = 'Loading the agent'
  const [module, sqlite3, bash] = await Promise.all([
    WebAssembly.compileStreaming(fetch(wasm)),
    sqlite3InitModule(),
    Bash.create({ files: corpus }),
  ])
  metric('agent.load.ms', performance.now() - start)

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

  let first = 0
  const runtime = await AgentRuntime.instantiate(module, sql, {
    published(events) {
      for (const entry of events) {
        const logged = entry.event as {
          event?: { payload?: Record<string, unknown>; type?: string }
          source?: string
        }
        if (logged.source !== 'agent' || !logged.event) continue
        if (logged.event.type === 'tool.call') status.textContent = 'Searching the sources'
        if (logged.event.type !== 'assistant.delta') continue
        if (!first) {
          first = performance.now()
          metric('turn.firstToken.ms', first - start)
        }
        answer.append(String(logged.event.payload?.text ?? ''))
      }
    },
  })
  metric('agent.ready.ms', performance.now() - start)

  await runtime.open(
    {
      code_mode: true,
      endpoint: `${location.origin}/api/model`,
      event_coalesce_ms: 50,
      model: 'gpt-6-luna',
      provider: 'codex',
      scope: 'page',
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
        fetch(request.endpoint, {
          body: request.body as Uint8Array<ArrayBuffer>,
          headers: request.headers,
          method: 'POST',
          redirect: 'error',
          signal,
        }),
      workspace: bash.workspace(),
    },
  )

  status.textContent = 'Thinking'
  await runtime.submit('page', { metadata: {}, prompt, request_id: crypto.randomUUID() })
  for (;;) {
    const next = (await runtime.pending('page'))[0]
    if (!next) break
    const driven = await runtime.drive(next.report.request_id)
    if (driven.retry) throw new Error('The session must reopen. Reload the page.')
    if (driven.waiting) await new Promise((resolve) => setTimeout(resolve, 250))
  }

  metric('turn.total.ms', performance.now() - start)
  metric('model.requests', runtime.metrics.model_requests)
  metric('agent.memory.mb', runtime.memoryBytes / 1e6)
  status.textContent = 'Done'
  await runtime.dispose()
}

function metric(name: string, value: number) {
  metrics[name] = Math.round(value)
  const term = document.createElement('dt')
  term.textContent = name
  const detail = document.createElement('dd')
  detail.textContent = String(metrics[name])
  list.append(term, detail)
}
