import { createActor, fromPromise, waitFor } from 'xstate'
import { getShortestPaths } from 'xstate/graph'
import { describe, expect, test } from 'vite-plus/test'
import { machines } from './Client.js'

describe('machines.agent', () => {
  function start(load: () => Promise<void>) {
    return createActor(machines.agent.provide({ actors: { load: fromPromise(load) } })).start()
  }

  test('loads once and stays ready', async () => {
    let loads = 0
    const actor = start(async () => {
      loads++
    })
    expect(machines.agentStatus(actor.getSnapshot())).toMatchInlineSnapshot(`"idle"`)

    actor.send({ type: 'agent.load' })
    expect(machines.agentStatus(actor.getSnapshot())).toMatchInlineSnapshot(`"loading"`)
    const snapshot = await waitFor(actor, (next) => next.value === 'ready')
    actor.send({ type: 'agent.load' })

    expect({
      loads,
      status: machines.agentStatus(actor.getSnapshot()),
      error: snapshot.context.error,
    }).toMatchInlineSnapshot(`
        {
          "error": undefined,
          "loads": 1,
          "status": "ready",
        }
      `)
  })

  test('records a failed load and loads again on the next request', async () => {
    const results = [new Error('The corpus failed to load (HTTP 503).'), undefined]
    const actor = start(async () => {
      const result = results.shift()
      if (result) throw result
    })

    actor.send({ type: 'agent.load' })
    const failed = await waitFor(actor, (next) => next.value === 'failed')
    expect(failed.context.error).toMatchInlineSnapshot(`"The corpus failed to load (HTTP 503)."`)

    actor.send({ type: 'agent.load' })
    const ready = await waitFor(actor, (next) => next.value === 'ready')
    expect(machines.agentStatus(ready)).toMatchInlineSnapshot(`"ready"`)
  })
})

describe('machines.turn', () => {
  const corpus = {
    files: { '/sources/docs/fees.md': '', '/sources/docs/memos.md': '' },
    urls: { '/sources/docs/memos.md': 'https://github.com/org/docs/blob/abc/memos.md' },
  }

  test('searches, reads files, and streams an answer', () => {
    const actor = createActor(machines.turn).start()
    actor.send({ type: 'agent.ready' })
    actor.send({ type: 'tool.call' })
    actor.send({
      files: machines.files(
        '{"cmd":"rg -n memo /"}\n/sources/docs/memos.md:3:Attach a memo. /sources/missing.md',
        corpus,
      ),
      type: 'tool.result',
    })
    actor.send({ type: 'tool.call' })
    actor.send({
      files: machines.files('{"cmd":"cat /sources/docs/memos.md /sources/docs/fees.md"}', corpus),
      type: 'tool.result',
    })
    actor.send({ text: 'Use ', type: 'text.delta' })
    actor.send({ text: 'transferWithMemo.', type: 'text.delta' })
    actor.send({ type: 'turn.complete' })

    expect(machines.turnState(actor.getSnapshot())).toMatchInlineSnapshot(`
      {
        "error": undefined,
        "files": [
          {
            "path": "/sources/docs/memos.md",
            "url": "https://github.com/org/docs/blob/abc/memos.md",
          },
          {
            "path": "/sources/docs/fees.md",
            "url": undefined,
          },
        ],
        "status": "done",
        "text": "Use transferWithMemo.",
      }
    `)
  })

  test('finishes when the run completes during a tool call', () => {
    const actor = createActor(machines.turn).start()
    actor.send({ type: 'agent.ready' })
    actor.send({ type: 'tool.call' })
    actor.send({ type: 'turn.complete' })

    expect(machines.turnStatus(actor.getSnapshot())).toMatchInlineSnapshot(`"done"`)
  })

  test('fails when the agent does not load', () => {
    const actor = createActor(machines.turn).start()
    actor.send({ error: 'The agent module failed to load.', type: 'agent.fail' })
    actor.send({ type: 'agent.ready' })

    expect(machines.turnState(actor.getSnapshot())).toMatchInlineSnapshot(`
      {
        "error": "The agent module failed to load.",
        "files": [],
        "status": "failed",
        "text": "",
      }
    `)
  })

  test('ignores output after a cancel', () => {
    const actor = createActor(machines.turn).start()
    actor.send({ type: 'agent.ready' })
    actor.send({ text: 'Partial', type: 'text.delta' })
    actor.send({ type: 'turn.cancel' })
    actor.send({ text: ' answer', type: 'text.delta' })
    actor.send({ type: 'turn.complete' })

    expect(machines.turnState(actor.getSnapshot())).toMatchInlineSnapshot(`
      {
        "error": undefined,
        "files": [],
        "status": "cancelled",
        "text": "Partial",
      }
    `)
  })

  test('reaches every status, and each ends where its state says', () => {
    const events = {
      'agent.fail': { error: 'The agent module failed to load.', type: 'agent.fail' },
      'agent.ready': { type: 'agent.ready' },
      'text.delta': { text: 'text', type: 'text.delta' },
      'tool.call': { type: 'tool.call' },
      'tool.result': { files: [], type: 'tool.result' },
      'turn.cancel': { type: 'turn.cancel' },
      'turn.complete': { type: 'turn.complete' },
      'turn.fail': { error: 'The agent could not answer.', type: 'turn.fail' },
    } satisfies Record<machines.turn.Event['type'], machines.turn.Event>

    const paths = getShortestPaths(machines.turn, {
      events: (snapshot) => Object.values(events).filter((event) => snapshot.can(event)),
      serializeState: (snapshot) => String(snapshot.value),
    })

    for (const event of Object.values(events))
      expect(
        paths.some((path) => path.state.can(event)),
        event.type,
      ).toBe(true)
    // A turn holds an error exactly when it failed.
    for (const path of paths) {
      const state = machines.turnState(path.state)
      expect(state.error !== undefined, state.status).toBe(state.status === 'failed')
    }
    expect(
      paths.map(
        (path) =>
          `${path.steps.map((step) => step.event.type).join(' → ')} = ${String(path.state.value)}`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "xstate.init = queued",
        "xstate.init → agent.fail = failed",
        "xstate.init → agent.ready = thinking",
        "xstate.init → turn.cancel = cancelled",
        "xstate.init → agent.ready → text.delta = streaming",
        "xstate.init → agent.ready → tool.call = searching",
        "xstate.init → agent.ready → turn.complete = done",
      ]
    `)
  })
})
