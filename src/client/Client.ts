/**
 * The headless Vocs client. `Client.create` returns an object that asks questions and reports
 * each answer as it streams, with the corpus files the agent read. The agent loads on the first
 * question. Two machines own the lifecycles: `machines.agent` for the load and `machines.turn`
 * for one question. UI layers read them through `{ get, subscribe }` stores.
 * @module
 */
import {
  assertEvent,
  assign,
  createActor,
  fromPromise,
  setup,
  type ActorRefFrom,
  type SnapshotFrom,
  waitFor,
} from 'xstate'
import type * as Block from '../Block.js'
import type * as Agent from './Agent.js'

/** A client for one page. */
export type Client = {
  /** The agent's load status. */
  agent: Store<machines.agent.Status>
  /** Asks one question. Questions and pages run in order, one at a time. */
  ask(prompt: string): Turn
  /**
   * Generates pages of blocks for a prompt: one page, or docs of several pages in sidebar groups.
   * Blocks stream in as the agent writes them.
   */
  generate(prompt: string, options?: generate.Options): Guide
}

export declare namespace generate {
  type Options = {
    /** `page` writes one page. `docs` writes two to eight pages in sidebar groups. Defaults to `page`. */
    mode?: 'docs' | 'page' | undefined
  }
}

/** Generated pages, in sidebar order. */
export type Guide = Store<Guide.State> & {
  /** Stops the running generation or revision. */
  cancel(): void
  mode: 'docs' | 'page'
  prompt: string
  /** Revises the pages, such as "use Express" or "shorter". Ignored while the agent writes. */
  refine(prompt: string): void
}

export declare namespace Guide {
  /** One generated page. */
  type Page = {
    blocks: readonly Block.Rendered[]
    /** Sidebar group, such as "Clients & Transports". */
    group: string
    /** Unique URL segment derived from the title, such as `set-up-a-client`. */
    slug: string
    /** Sidebar title, such as "Set Up a Client". */
    title: string
  }

  type State = {
    /** The failure message when `status` is `failed`. */
    error: string | undefined
    /** Corpus files the agent read, in first-read order. */
    files: readonly File[]
    pages: readonly Page[]
    status: machines.guide.Status
  }
}

/** A file the agent read, with its origin URL when the source reports one. */
export type File = {
  /** Mount path, such as `/sources/docs/memos.md`. */
  path: string
  url?: string | undefined
}

/** A readable value that notifies listeners when it changes. */
export type Store<value> = {
  get(): value
  subscribe(listener: () => void): () => void
}

/** One question and its streaming answer. */
export type Turn = Store<Turn.State> & {
  /** Stops the question. The turn ends as `cancelled`. */
  cancel(): void
  /** Resolves when the turn ends, in any final status. */
  done: Promise<Turn.State>
  prompt: string
}

export declare namespace Turn {
  type State = {
    /** The failure message when `status` is `failed`. */
    error: string | undefined
    files: readonly File[]
    status: machines.turn.Status
    text: string
  }
}

/** Creates a client for a handler mounted at `basePath`. */
export function create(options: create.Options = {}): Client {
  const basePath = (options.basePath ?? '/docs').replace(/\/$/, '')
  const fetcher = options.fetch ?? ((input, init) => fetch(input, init))

  let loaded: Agent.Agent | undefined
  let queue: Promise<unknown> = Promise.resolve()

  const agent = createActor(
    machines.agent.provide({
      actors: {
        load: fromPromise(async () => {
          const module = await import('./Agent.js')
          loaded = await module.load({ basePath, fetch: fetcher })
        }),
      },
    }),
  ).start()

  async function ready(): Promise<Agent.Agent> {
    const status = machines.agentStatus(agent.getSnapshot())
    if (status === 'idle' || status === 'failed') agent.send({ type: 'agent.load' })
    const snapshot = await waitFor(agent, (next) =>
      ['failed', 'ready'].includes(machines.agentStatus(next)),
    )
    if (machines.agentStatus(snapshot) === 'failed') throw new Error(snapshot.context.error)
    return loaded!
  }

  return {
    agent: store(agent, machines.agentStatus),
    ask(prompt) {
      const turn = createActor(machines.turn).start()

      queue = queue.then(async () => {
        const current = await ready().catch((error: unknown) => {
          turn.send({ error: message(error), type: 'agent.fail' })
        })
        if (!current || machines.turnStatus(turn.getSnapshot()) !== 'queued') return
        turn.send({ type: 'agent.ready' })

        await current
          .ask(prompt, {
            delta: (text) => turn.send({ text, type: 'text.delta' }),
            toolCall: () => turn.send({ type: 'tool.call' }),
            toolResult: (output) =>
              turn.send({ files: machines.files(output, current.corpus), type: 'tool.result' }),
          })
          .then(
            () => turn.send({ type: 'turn.complete' }),
            (error: unknown) => turn.send({ error: message(error), type: 'turn.fail' }),
          )
      })

      const state = store(turn, machines.turnState)
      return {
        ...state,
        cancel() {
          turn.send({ type: 'turn.cancel' })
          void loaded?.cancel()
        },
        done: waitFor(turn, (snapshot) => snapshot.status === 'done').then(state.get),
        prompt,
      }
    },
    generate(prompt, options = {}) {
      const mode = options.mode ?? 'page'
      const guide = createActor(machines.guide).start()

      function run(text: string) {
        queue = queue.then(async () => {
          const current = await ready().catch((error: unknown) => {
            guide.send({ error: message(error), type: 'agent.fail' })
          })
          if (!current || !machines.writing(guide.getSnapshot())) return

          await current
            .ask(text, {
              delta() {},
              page: (operation) => apply(guide, operation),
              toolCall() {},
              toolResult: (output) =>
                guide.send({ files: machines.files(output, current.corpus), type: 'tool.result' }),
            })
            .then(
              () => guide.send({ type: 'turn.complete' }),
              (error: unknown) => guide.send({ error: message(error), type: 'turn.fail' }),
            )
        })
      }

      run(`${mode === 'docs' ? 'Write docs' : 'Write a page'}: ${prompt}`)
      return {
        ...store(guide, machines.guideState),
        cancel() {
          guide.send({ type: 'guide.cancel' })
          void loaded?.cancel()
        },
        mode,
        prompt,
        refine(next) {
          if (!guide.getSnapshot().can({ type: 'guide.refine' })) return
          guide.send({ type: 'guide.refine' })
          run(`Revise: ${next}`)
        },
      }
    },
  }
}

export declare namespace create {
  type Options = {
    /** Path where the handler is mounted. Defaults to `/docs`. */
    basePath?: string | undefined
    /** Fetch for every request the client and agent send. Defaults to `fetch`. */
    fetch?: typeof fetch | undefined
  }
}

/** Applies a page tool call to a guide and returns the result the agent reads. */
function apply(guide: machines.guide.Actor, operation: Agent.Operation): unknown {
  const snapshot = guide.getSnapshot()
  if (operation.type === 'page.read') return machines.outline(snapshot, operation.page)
  if (!machines.writing(snapshot)) throw new Error('The reader stopped these pages. Stop writing.')
  if (operation.type !== 'page.create') {
    const page = snapshot.context.pages.find((entry) => entry.slug === operation.page)
    if (!page)
      throw new Error(
        `Page "${operation.page}" does not exist. Read the outline with \`page_read\`.`,
      )
    if (!snapshot.can(operation))
      throw new Error(
        `Block ${'index' in operation ? operation.index : ''} does not exist. The page has ${page.blocks.length} blocks.`,
      )
  }

  guide.send(operation)
  const pages = guide.getSnapshot().context.pages
  if (operation.type === 'page.create') return { page: pages.at(-1)!.slug }
  return { blocks: pages.find((entry) => entry.slug === operation.page)?.blocks.length ?? 0 }
}

/** Returns a store over an actor whose value changes only when the selected snapshot changes. */
function store<snapshot, value>(
  actor: {
    getSnapshot(): snapshot
    subscribe(listener: () => void): { unsubscribe(): void }
  },
  select: (snapshot: snapshot) => value,
): Store<value> {
  let last: snapshot | undefined
  let value: value
  return {
    get() {
      const next = actor.getSnapshot()
      if (next !== last) {
        last = next
        value = select(next)
      }
      return value
    },
    subscribe(listener) {
      const subscription = actor.subscribe(() => listener())
      return () => subscription.unsubscribe()
    },
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export namespace machines {
  /** Loads the agent. `load` is provided by `Client.create`. */
  export const agent = setup({
    actions: {
      recordError: assign({
        error: (args) => message((args.event as { error?: unknown }).error),
      }),
    },
    actors: {
      /** Provided by `Client.create`: imports and loads the agent module. */
      load: fromPromise<void>(async () => {}),
    },
    types: { context: {} as agent.Context, events: {} as agent.Event },
  }).createMachine({
    context: { error: undefined },
    id: 'agent',
    initial: 'idle',
    states: {
      failed: { on: { 'agent.load': 'loading' } },
      idle: { on: { 'agent.load': 'loading' } },
      loading: {
        invoke: {
          onDone: 'ready',
          onError: { actions: 'recordError', target: 'failed' },
          src: 'load',
        },
      },
      ready: {},
    },
  })

  export declare namespace agent {
    type Actor = ActorRefFrom<typeof agent>
    type Context = {
      /** The load failure message, set in `failed`. */
      error: string | undefined
    }
    type Event = {
      /** The runner starts a load, on the first question or after a failure. */
      type: 'agent.load'
    }
    type Snapshot = SnapshotFrom<typeof agent>
    type Status = 'failed' | 'idle' | 'loading' | 'ready'
  }

  /** Returns the agent's load status. */
  export function agentStatus(snapshot: agent.Snapshot): agent.Status {
    return snapshot.value as agent.Status
  }

  /** One question, from waiting for the agent to a final status. */
  export const turn = setup({
    actions: {
      addFiles: assign({
        files: (args) => {
          assertEvent(args.event, 'tool.result')
          const known = new Set(args.context.files.map((file) => file.path))
          return [
            ...args.context.files,
            ...args.event.files.filter((file) => !known.has(file.path)),
          ]
        },
      }),
      appendText: assign({
        text: (args) => {
          assertEvent(args.event, 'text.delta')
          return args.context.text + args.event.text
        },
      }),
      recordError: assign({
        error: (args) => {
          assertEvent(args.event, ['agent.fail', 'turn.fail'])
          return args.event.error
        },
      }),
    },
    types: { context: {} as turn.Context, events: {} as turn.Event },
  }).createMachine({
    context: { error: undefined, files: [], text: '' },
    id: 'turn',
    initial: 'queued',
    states: {
      cancelled: { type: 'final' },
      done: { type: 'final' },
      failed: { type: 'final' },
      queued: {
        on: {
          'agent.fail': { actions: 'recordError', target: 'failed' },
          'agent.ready': 'thinking',
          'turn.cancel': 'cancelled',
        },
      },
      searching: {
        on: {
          'tool.call': 'searching',
          'tool.result': { actions: 'addFiles', target: 'thinking' },
          'turn.cancel': 'cancelled',
          'turn.complete': 'done',
          'turn.fail': { actions: 'recordError', target: 'failed' },
        },
      },
      streaming: {
        on: {
          'text.delta': { actions: 'appendText' },
          'tool.call': 'searching',
          'turn.cancel': 'cancelled',
          'turn.complete': 'done',
          'turn.fail': { actions: 'recordError', target: 'failed' },
        },
      },
      thinking: {
        on: {
          'text.delta': { actions: 'appendText', target: 'streaming' },
          'tool.call': 'searching',
          'turn.cancel': 'cancelled',
          'turn.complete': 'done',
          'turn.fail': { actions: 'recordError', target: 'failed' },
        },
      },
    },
  })

  export declare namespace turn {
    type Actor = ActorRefFrom<typeof turn>
    type Context = {
      /** The failure message, set in `failed`. */
      error: string | undefined
      /** Corpus files the agent read, in first-read order. */
      files: readonly File[]
      /** The answer text streamed so far. */
      text: string
    }
    type Event =
      /** The agent failed to load. */
      | { error: string; type: 'agent.fail' }
      /** The agent loaded and earlier questions finished. */
      | { type: 'agent.ready' }
      /** The agent started a tool call. */
      | { type: 'tool.call' }
      /** A shell command returned. `files` are the corpus files its output names. */
      | { files: readonly File[]; type: 'tool.result' }
      /** A piece of answer text arrived. */
      | { text: string; type: 'text.delta' }
      /** The reader cancelled the question. */
      | { type: 'turn.cancel' }
      /** The question finished. */
      | { type: 'turn.complete' }
      /** The question failed after the agent loaded. */
      | { error: string; type: 'turn.fail' }
    type Snapshot = SnapshotFrom<typeof turn>
    /**
     * `queued`: waiting for the agent to load or an earlier question to finish. `thinking`: the
     * model is working. `searching`: a tool call is running. `streaming`: answer text is arriving.
     */
    type Status =
      | 'cancelled'
      | 'done'
      | 'failed'
      | 'queued'
      | 'searching'
      | 'streaming'
      | 'thinking'
  }

  /** Returns the turn's status. */
  export function turnStatus(snapshot: turn.Snapshot): turn.Status {
    return snapshot.value as turn.Status
  }

  /** Returns the turn's state for UI layers. */
  export function turnState(snapshot: turn.Snapshot): Turn.State {
    return {
      error: snapshot.context.error,
      files: snapshot.context.files,
      status: turnStatus(snapshot),
      text: snapshot.context.text,
    }
  }

  const writingState = {
    on: {
      'agent.fail': { actions: 'recordError', target: 'failed' },
      'block.insert': { actions: 'insertBlock', guard: 'canInsert' },
      'block.remove': { actions: 'removeBlock', guard: 'hasBlock' },
      'block.replace': { actions: 'replaceBlock', guard: 'hasBlock' },
      'guide.cancel': 'cancelled',
      'page.create': { actions: 'createPage' },
      'page.delete': { actions: 'deletePage', guard: 'hasPage' },
      'page.update': { actions: 'updatePage', guard: 'hasPage' },
      'tool.result': { actions: 'addFiles' },
      'turn.complete': 'ready',
      'turn.fail': { actions: 'recordError', target: 'failed' },
    },
    tags: ['writing'],
  } as const

  /**
   * Generated pages. `generating` and `refining` take page tool calls from the agent. A
   * revision starts from `ready`, `failed`, or `cancelled`, and keeps the pages written so far.
   */
  export const guide = setup({
    actions: {
      addFiles: assign({
        files: (args) => {
          assertEvent(args.event, 'tool.result')
          const known = new Set(args.context.files.map((file) => file.path))
          return [
            ...args.context.files,
            ...args.event.files.filter((file) => !known.has(file.path)),
          ]
        },
      }),
      clearError: assign({ error: undefined }),
      createPage: assign({
        pages: (args) => {
          assertEvent(args.event, 'page.create')
          const base = slug(args.event.title)
          const taken = new Set(args.context.pages.map((page) => page.slug))
          let next = base
          for (let suffix = 2; taken.has(next); suffix++) next = `${base}-${suffix}`
          return [
            ...args.context.pages,
            { blocks: [], group: args.event.group, slug: next, title: args.event.title },
          ]
        },
      }),
      deletePage: assign({
        pages: (args) => {
          assertEvent(args.event, 'page.delete')
          const event = args.event
          return args.context.pages.filter((page) => page.slug !== event.page)
        },
      }),
      insertBlock: assign({
        pages: (args) => {
          assertEvent(args.event, 'block.insert')
          const event = args.event
          return edit(args.context.pages, event.page, (blocks) => {
            const next = [...blocks]
            next.splice(event.index ?? next.length, 0, event.block)
            return next
          })
        },
      }),
      recordError: assign({
        error: (args) => {
          assertEvent(args.event, ['agent.fail', 'turn.fail'])
          return args.event.error
        },
      }),
      removeBlock: assign({
        pages: (args) => {
          assertEvent(args.event, 'block.remove')
          const event = args.event
          return edit(args.context.pages, event.page, (blocks) =>
            blocks.filter((_, index) => index !== event.index),
          )
        },
      }),
      replaceBlock: assign({
        pages: (args) => {
          assertEvent(args.event, 'block.replace')
          const event = args.event
          return edit(args.context.pages, event.page, (blocks) =>
            blocks.map((block, index) => (index === event.index ? event.block : block)),
          )
        },
      }),
      updatePage: assign({
        pages: (args) => {
          assertEvent(args.event, 'page.update')
          const event = args.event
          return args.context.pages.map((page) =>
            page.slug === event.page
              ? { ...page, group: event.group ?? page.group, title: event.title ?? page.title }
              : page,
          )
        },
      }),
    },
    guards: {
      /** The page exists, and the insert index is at most its block count. */
      canInsert: (args) => {
        assertEvent(args.event, 'block.insert')
        const event = args.event
        const page = args.context.pages.find((entry) => entry.slug === event.page)
        return page !== undefined && (event.index ?? 0) <= page.blocks.length
      },
      /** The index names an existing block of an existing page. */
      hasBlock: (args) => {
        assertEvent(args.event, ['block.remove', 'block.replace'])
        const event = args.event
        const page = args.context.pages.find((entry) => entry.slug === event.page)
        return page !== undefined && event.index < page.blocks.length
      },
      /** The page exists. */
      hasPage: (args) => {
        assertEvent(args.event, ['page.delete', 'page.update'])
        const event = args.event
        return args.context.pages.some((page) => page.slug === event.page)
      },
    },
    types: { context: {} as guide.Context, events: {} as guide.Event },
  }).createMachine({
    context: { error: undefined, files: [], pages: [] },
    id: 'guide',
    initial: 'generating',
    states: {
      cancelled: { on: { 'guide.refine': 'refining' } },
      failed: { on: { 'guide.refine': { actions: 'clearError', target: 'refining' } } },
      generating: writingState,
      ready: { on: { 'guide.refine': 'refining' } },
      refining: writingState,
    },
  })

  export declare namespace guide {
    type Actor = ActorRefFrom<typeof guide>
    type Context = {
      /** The failure message, set in `failed`. */
      error: string | undefined
      /** Corpus files the agent read, in first-read order. */
      files: readonly File[]
      /** Pages in sidebar order. */
      pages: readonly Guide.Page[]
    }
    type Event =
      /** The agent failed to load. */
      | { error: string; type: 'agent.fail' }
      /** The reader stopped the agent. */
      | { type: 'guide.cancel' }
      /** The reader asked for a revision. */
      | { type: 'guide.refine' }
      /** A page tool call changed the pages. */
      | Exclude<Agent.Operation, { type: 'page.read' }>
      /** A shell command returned. `files` are the corpus files its output names. */
      | { files: readonly File[]; type: 'tool.result' }
      /** The agent finished the turn. */
      | { type: 'turn.complete' }
      /** The turn failed after the agent loaded. */
      | { error: string; type: 'turn.fail' }
    type Snapshot = SnapshotFrom<typeof guide>
    /**
     * `generating`: the first turn is writing. `refining`: a revision is writing. `ready`: the
     * last turn finished.
     */
    type Status = 'cancelled' | 'failed' | 'generating' | 'ready' | 'refining'
  }

  /** Returns the guide's status. */
  export function guideStatus(snapshot: guide.Snapshot): guide.Status {
    return snapshot.value as guide.Status
  }

  /** Returns the guide's state for UI layers. */
  export function guideState(snapshot: guide.Snapshot): Guide.State {
    return { ...snapshot.context, status: guideStatus(snapshot) }
  }

  /** Returns what `page_read` shows the agent: the outline, or one page with its blocks. */
  export function outline(snapshot: guide.Snapshot, slug: string | undefined) {
    const pages = snapshot.context.pages
    if (slug === undefined)
      return {
        pages: pages.map((page) => ({
          blocks: page.blocks.length,
          group: page.group,
          page: page.slug,
          title: page.title,
        })),
      }
    const page = pages.find((entry) => entry.slug === slug)
    if (!page) throw new Error(`Page "${slug}" does not exist.`)
    return { ...page, blocks: page.blocks.map((block, index) => ({ block, index })) }
  }

  /** Whether the agent is writing, so page tool calls apply. */
  export function writing(snapshot: guide.Snapshot): boolean {
    return snapshot.hasTag('writing')
  }

  /** Returns the URL segment of a title, such as `set-up-a-client`. */
  export function slug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'page'
    )
  }

  /** Returns `pages` with the blocks of one page changed. */
  function edit(
    pages: readonly Guide.Page[],
    slug: string,
    fn: (blocks: readonly Block.Rendered[]) => readonly Block.Rendered[],
  ): readonly Guide.Page[] {
    return pages.map((page) => (page.slug === slug ? { ...page, blocks: fn(page.blocks) } : page))
  }

  /** Returns the corpus files that a shell output names, with their origin URLs. */
  export function files(
    output: string,
    corpus: { files: Record<string, string>; urls: Record<string, string> },
  ): readonly File[] {
    const paths = new Set(output.match(/\/sources\/[^\s:'"`)]+/g) ?? [])
    return [...paths]
      .filter((path) => path in corpus.files)
      .map((path) => ({ path, url: corpus.urls[path] }))
  }
}
