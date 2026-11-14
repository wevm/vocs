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
import type * as Agent from './Agent.js'

/** A client for one page. */
export type Client = {
  /** The agent's load status. */
  agent: Store<machines.agent.Status>
  /** Asks one question. Questions run in order, one at a time. */
  ask(prompt: string): Turn
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
