/**
 * The nanocode agent in the page. `Client` imports this module on the first question, so the
 * WebAssembly modules, the agent settings, and the corpus load only when a reader asks. One agent holds one session,
 * so later questions see earlier answers. The shell mounts corpus files at `/sources/`.
 * @module
 */
// oxlint-disable-next-line typescript/triple-slash-reference -- zile compiles only the entry graph, which an ambient declaration joins through a reference.
/// <reference path="../internal/assets.d.ts" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { AgentRuntime, Contracts } from 'nanocode-ts'
import { Bash } from 'nanocode-ts/bash'
import wasm from 'nanocode-ts/nanocode_wasm.wasm?url'
import * as z from 'zod/mini'
import * as Block from '../Block.js'
import * as Diagram from '../internal/Diagram.js'
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
  /** The agent settings the handler served. */
  settings: Handler.Agent
}

/** Progress callbacks of one question. */
export type Handlers = {
  delta(text: string): void
  /** A tool call started. */
  toolCall(): void
  /** A tool call returned. `output` holds its shell commands and their output. */
  toolResult(output: string): void
  /**
   * Applies a page tool call and returns the result the agent reads. Set only for page and docs
   * messages. Throws with a message the agent reads when the operation does not apply.
   */
  page?: ((operation: Operation) => unknown) | undefined
}

/** A validated page tool call. `page` is the slug that `page_create` returns. */
export type Operation =
  | { block: Block.Rendered; index: number | undefined; page: string; type: 'block.insert' }
  | { index: number; page: string; type: 'block.remove' }
  | { block: Block.Rendered; index: number; page: string; type: 'block.replace' }
  | { group: string; title: string; type: 'page.create' }
  | { page: string; type: 'page.delete' }
  | { page: string | undefined; type: 'page.read' }
  | { group: string | undefined; page: string; title: string | undefined; type: 'page.update' }

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
  const diagram = Diagram.create()
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
      tools: tools(),
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
      tools: {
        async call(name, input) {
          if (!handlers?.page)
            throw new Error('Page tools work only for messages that ask for a page or docs.')
          const next = operation(name, input)
          if (!('block' in next)) return handlers.page(next)
          if (next.block.type === 'demo')
            return handlers.page({ ...next, block: await demo(options, settings, next.block) })
          // A diagram that fails to render returns to the agent, so it fixes the source.
          if (next.block.type === 'mermaid')
            await diagram.render(next.block.diagram).catch((error: unknown) => {
              throw new Error(
                `The mermaid diagram does not render. Fix it and emit the block again:\n${error instanceof Error ? error.message : String(error)}`,
              )
            })
          return handlers.page({ ...next, block: await highlight(options, next.block) })
        },
      },
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
    settings,
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

/**
 * Checks a demo block against the registered demos. The handler validates its props with the
 * demo's schema and returns them with defaults applied. A rejected block throws with the reason,
 * so the agent fixes it.
 */
async function demo(
  options: load.Options,
  settings: Handler.Agent,
  block: Extract<Block.Block, { type: 'demo' }>,
): Promise<Block.Rendered> {
  const names = Object.keys(settings.demos)
  if (!Object.hasOwn(settings.demos, block.name))
    throw new Error(
      `Demo "${block.name}" is not registered. ${names.length ? `Use one of: ${names.join(', ')}.` : 'Remove the block.'}`,
    )
  if (!settings.demos[block.name]!.props && block.props === undefined) return block

  const response = await options
    .fetch(`${options.basePath}/demos/${encodeURIComponent(block.name)}`, {
      body: JSON.stringify(block.props ?? {}),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    .catch(() => undefined)
  if (!response?.ok)
    throw new Error(`The props of demo "${block.name}" could not be checked. Emit the block again.`)
  const result = (await response.json()) as Handler.Demo
  if (result.error !== undefined) throw new Error(result.error)
  return { ...block, props: result.props }
}

/**
 * Adds highlighted HTML to the code of a block. A snippet that does not render, such as a
 * Twoslash snippet with a type error, throws with the route's message, so the agent fixes it.
 * A failed request leaves the snippet as plain code.
 */
async function highlight(options: load.Options, block: Block.Rendered): Promise<Block.Rendered> {
  async function render(snippet: { code: string; lang: string; twoslash?: boolean | undefined }) {
    const response = await options
      .fetch(`${options.basePath}/render`, {
        body: JSON.stringify({
          code: snippet.code,
          lang: snippet.lang,
          twoslash: snippet.twoslash,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      .catch(() => undefined)
    if (!response?.ok) return undefined
    const result = (await response.json()) as Handler.Render
    if (result.error !== undefined) throw new Error(result.error)
    return result.html
  }

  if (block.type === 'code') return { ...block, html: await render(block) }
  if (block.type === 'codeGroup')
    return {
      ...block,
      tabs: await Promise.all(block.tabs.map(async (tab) => ({ ...tab, html: await render(tab) }))),
    }
  return block
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

/** Returns the page tools, which Code Mode cells call as `tools.page_insert(...)`. */
function tools(): Contracts.HostTool[] {
  const { $schema: _, ...block } = z.toJSONSchema(Block.schema.block) as Record<string, unknown>
  const string = (description: string) => ({ description, minLength: 1, type: 'string' })
  const index = { minimum: 0, type: 'integer' }
  const page = string('Page slug from `page_create`.')
  const title = string(titles.page)
  const group = string(titles.group)
  const object = (properties: Record<string, unknown>, required: readonly string[]) => ({
    additionalProperties: false,
    properties,
    required,
    type: 'object',
  })
  return [
    {
      description:
        'Creates an empty page in a sidebar group and returns its slug. Pages appear in creation order.',
      name: 'page_create',
      parameters: object({ group, title }, ['group', 'title']),
    },
    {
      description:
        'Without `page`, returns the outline: every page with its group, title, and block count. With `page`, returns that page with its blocks and their indexes.',
      name: 'page_read',
      parameters: object({ page }, []),
    },
    {
      description: 'Renames a page or moves it to another group.',
      name: 'page_update',
      parameters: object({ group, page, title }, ['page']),
    },
    { description: 'Deletes a page.', name: 'page_delete', parameters: object({ page }, ['page']) },
    {
      description:
        'Adds one block to a page at `index`, or at the end without one. Call once per block, in reading order, so the page renders as you write it.',
      name: 'page_insert',
      parameters: object({ block, index, page }, ['block', 'page']),
    },
    {
      description: 'Replaces the block at `index`.',
      name: 'page_replace',
      parameters: object({ block, index, page }, ['block', 'index', 'page']),
    },
    {
      description: 'Removes the block at `index`. Later blocks move up by one.',
      name: 'page_remove',
      parameters: object({ index, page }, ['index', 'page']),
    },
  ]
}

/** Sidebar naming rules, enforced by `operation` and repeated to the agent. */
const titles = {
  group:
    'Sidebar group: a Title Case noun phrase of at most four words, such as "Clients & Transports".',
  page: 'Sidebar title: Title Case, at most five words, led by a verb, such as "Set Up a Client" or "Query Logs". The first page of a group may be "Overview".',
} as const

/**
 * Validates a page tool call.
 *
 * @throws When the input does not match the tool. The message names the fault.
 */
function operation(name: string, input: unknown): Operation {
  const value = (input ?? {}) as Record<string, unknown>
  const text = (key: string, words: number, rule: string) => {
    const raw = value[key]
    if (typeof raw !== 'string' || !raw.trim())
      throw new Error(`\`${key}\` must be a non-empty string.`)
    if (raw.trim().split(/\s+/).length > words) throw new Error(`\`${key}\` is too long. ${rule}`)
    return raw.trim()
  }
  const optional = (key: string, words: number, rule: string) =>
    value[key] === undefined ? undefined : text(key, words, rule)
  const page = () => text('page', 1, 'Use the slug that `page_create` returned.')
  const index = () => {
    const raw = value.index
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0)
      throw new Error('`index` must be a block index, an integer from 0.')
    return raw
  }

  if (name === 'page_create')
    return {
      group: text('group', 4, titles.group),
      title: text('title', 5, titles.page),
      type: 'page.create',
    }
  if (name === 'page_read')
    return { page: value.page === undefined ? undefined : page(), type: 'page.read' }
  if (name === 'page_update')
    return {
      group: optional('group', 4, titles.group),
      page: page(),
      title: optional('title', 5, titles.page),
      type: 'page.update',
    }
  if (name === 'page_delete') return { page: page(), type: 'page.delete' }
  if (name === 'page_insert')
    return {
      block: Block.parse(value.block),
      index: value.index === undefined ? undefined : index(),
      page: page(),
      type: 'block.insert',
    }
  if (name === 'page_replace')
    return { block: Block.parse(value.block), index: index(), page: page(), type: 'block.replace' }
  if (name === 'page_remove') return { index: index(), page: page(), type: 'block.remove' }
  throw new Error(`Tool "${name}" does not exist.`)
}

function instructions(settings: Handler.Agent) {
  return [
    `You answer questions about ${settings.title}${settings.description ? `: ${settings.description}` : ''}.`,
    'The documentation sources are files under /sources. Search them with `rg` and read them with `cat` before you answer.',
    'Answer only from those files. Name the file paths you used. If the files do not answer the question, say so.',
    'A message that starts with "Write a page:" asks for one page. Search the sources first. Create the page with `tools.page_create`, then add its blocks with `tools.page_insert`, one block per call, in reading order.',
    'A message that starts with "Write docs:" asks for a small documentation site of two to eight pages. Search the sources first. Plan sidebar groups, start each group with an "Overview" page, and create every page with `tools.page_create` before you fill them with `tools.page_insert`.',
    `${titles.page} ${titles.group}`,
    'Prefer short prose, steps, and complete code blocks taken from the sources. Never invent an API.',
    ...(settings.twoslash
      ? [
          `Set \`twoslash: true\` on complete \`ts\` and \`tsx\` code blocks. Twoslash type-checks them${settings.twoslash.length ? ` with these packages installed: ${settings.twoslash.join(', ')}` : ''}. A block with a type error is rejected with the compiler errors: fix the code and emit the block again. Add \`//    ^?\` queries under key identifiers to show their types.`,
        ]
      : []),
    ...(Object.keys(settings.demos).length
      ? [
          'Add a `demo` block where an interactive example helps the reader. Registered demos, with the JSON Schema of their `props`:',
          ...Object.entries(settings.demos).map(
            ([name, demo]) =>
              `- ${name}: ${demo.props ? JSON.stringify(demo.props) : 'takes no props'}`,
          ),
        ]
      : []),
    'A message that starts with "Revise:" asks for a change to the pages already written. Read the outline with `tools.page_read`, then change only what the message asks.',
    'After a page or docs message, reply with one sentence that says what the pages cover or what changed.',
  ].join('\n')
}
