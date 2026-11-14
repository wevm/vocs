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

describe('machines.guide', () => {
  const prose = (markdown: string) => ({ markdown, type: 'prose' }) as const

  test('writes pages in sidebar order with unique slugs', () => {
    const actor = createActor(machines.guide).start()
    actor.send({ group: 'Memos', title: 'Overview', type: 'page.create' })
    actor.send({ group: 'Memos', title: 'Attach a Memo', type: 'page.create' })
    actor.send({ group: 'Fees', title: 'Overview', type: 'page.create' })
    actor.send({
      block: prose('First'),
      index: undefined,
      page: 'attach-a-memo',
      type: 'block.insert',
    })
    actor.send({
      block: prose('Second'),
      index: undefined,
      page: 'attach-a-memo',
      type: 'block.insert',
    })
    actor.send({ block: prose('Zeroth'), index: 0, page: 'attach-a-memo', type: 'block.insert' })
    actor.send({ block: prose('Edited'), index: 1, page: 'attach-a-memo', type: 'block.replace' })
    actor.send({ index: 2, page: 'attach-a-memo', type: 'block.remove' })
    actor.send({ group: 'Fees', page: 'overview-2', title: 'Pay Fees', type: 'page.update' })
    actor.send({ page: 'overview', type: 'page.delete' })
    actor.send({ type: 'turn.complete' })

    expect(machines.guideState(actor.getSnapshot())).toMatchInlineSnapshot(`
      {
        "error": undefined,
        "files": [],
        "link": undefined,
        "pages": [
          {
            "blocks": [
              {
                "markdown": "Zeroth",
                "type": "prose",
              },
              {
                "markdown": "Edited",
                "type": "prose",
              },
            ],
            "group": "Memos",
            "slug": "attach-a-memo",
            "title": "Attach a Memo",
          },
          {
            "blocks": [],
            "group": "Fees",
            "slug": "overview-2",
            "title": "Pay Fees",
          },
        ],
        "save": "unavailable",
        "status": "ready",
      }
    `)
  })

  test('ignores calls on missing pages and blocks', () => {
    const actor = createActor(machines.guide).start()
    actor.send({ group: 'Memos', title: 'Overview', type: 'page.create' })
    const missing = [
      { block: prose('x'), index: undefined, page: 'nope', type: 'block.insert' },
      { block: prose('x'), index: 1, page: 'overview', type: 'block.insert' },
      { block: prose('x'), index: 0, page: 'overview', type: 'block.replace' },
      { index: 0, page: 'overview', type: 'block.remove' },
      { page: 'nope', type: 'page.delete' },
      { group: undefined, page: 'nope', title: 'X', type: 'page.update' },
    ] as const

    expect(missing.map((event) => actor.getSnapshot().can(event))).toMatchInlineSnapshot(`
      [
        false,
        false,
        false,
        false,
        false,
        false,
      ]
    `)
  })

  test('keeps the pages when a revision fails, and revises again', () => {
    const actor = createActor(machines.guide).start()
    actor.send({ group: 'Memos', title: 'Overview', type: 'page.create' })
    actor.send({ type: 'turn.complete' })
    actor.send({ type: 'guide.refine' })
    actor.send({ error: 'The agent could not answer.', type: 'turn.fail' })
    const failed = machines.guideState(actor.getSnapshot())
    actor.send({ type: 'guide.refine' })

    expect({
      failed: { error: failed.error, pages: failed.pages.length, status: failed.status },
      next: {
        error: actor.getSnapshot().context.error,
        status: machines.guideStatus(actor.getSnapshot()),
      },
    }).toMatchInlineSnapshot(`
      {
        "failed": {
          "error": "The agent could not answer.",
          "pages": 1,
          "status": "failed",
        },
        "next": {
          "error": undefined,
          "status": "refining",
        },
      }
    `)
  })

  test('saves the pages, saves again after a failure, and drops the link on a revision', async () => {
    const inputs: unknown[] = []
    const results = [new Error('This site has no storage.'), '/docs/pages/overview-k3f9a2']
    const actor = createActor(
      machines.guide.provide({
        actors: {
          save: fromPromise(async (args) => {
            inputs.push(args.input)
            const result = results.shift()!
            if (result instanceof Error) throw result
            return result
          }),
        },
      }),
    ).start()
    actor.send({ group: 'Memos', title: 'Overview', type: 'page.create' })
    actor.send({ files: [{ path: '/sources/docs/memos.md' }], type: 'tool.result' })
    actor.send({ type: 'turn.complete' })
    const unavailable = machines.guideState(actor.getSnapshot()).save
    actor.send({ storage: 'available', type: 'agent.ready' })
    const available = machines.guideState(actor.getSnapshot()).save

    actor.send({ type: 'guide.save' })
    const failed = machines.guideState(await waitFor(actor, (next) => next.value === 'saveFailed'))
    actor.send({ type: 'guide.save' })
    const saved = machines.guideState(await waitFor(actor, (next) => next.value === 'saved'))
    actor.send({ type: 'guide.refine' })
    const refining = machines.guideState(actor.getSnapshot())

    expect({
      available,
      failed: { error: failed.error, save: failed.save },
      inputs,
      refining: { link: refining.link, status: refining.status },
      saved: { error: saved.error, link: saved.link, save: saved.save },
      unavailable,
    }).toMatchInlineSnapshot(`
      {
        "available": "available",
        "failed": {
          "error": "This site has no storage.",
          "save": "available",
        },
        "inputs": [
          {
            "files": [
              {
                "path": "/sources/docs/memos.md",
              },
            ],
            "pages": [
              {
                "blocks": [],
                "group": "Memos",
                "slug": "overview",
                "title": "Overview",
              },
            ],
          },
          {
            "files": [
              {
                "path": "/sources/docs/memos.md",
              },
            ],
            "pages": [
              {
                "blocks": [],
                "group": "Memos",
                "slug": "overview",
                "title": "Overview",
              },
            ],
          },
        ],
        "refining": {
          "link": undefined,
          "status": "refining",
        },
        "saved": {
          "error": undefined,
          "link": "/docs/pages/overview-k3f9a2",
          "save": "unavailable",
        },
        "unavailable": "unavailable",
      }
    `)
  })

  test('reaches every status, and each ends where its state says', () => {
    const events = {
      'agent.fail': { error: 'The agent module failed to load.', type: 'agent.fail' },
      'agent.ready': { storage: 'available', type: 'agent.ready' },
      'block.insert': {
        block: prose('x'),
        index: undefined,
        page: 'overview',
        type: 'block.insert',
      },
      'block.remove': { index: 0, page: 'overview', type: 'block.remove' },
      'block.replace': { block: prose('y'), index: 0, page: 'overview', type: 'block.replace' },
      'guide.cancel': { type: 'guide.cancel' },
      'guide.refine': { type: 'guide.refine' },
      'guide.save': { type: 'guide.save' },
      'page.create': { group: 'Memos', title: 'Overview', type: 'page.create' },
      'page.delete': { page: 'overview', type: 'page.delete' },
      'page.update': {
        group: undefined,
        page: 'overview',
        title: 'Read Memos',
        type: 'page.update',
      },
      'tool.result': { files: [], type: 'tool.result' },
      'turn.complete': { type: 'turn.complete' },
      'turn.fail': { error: 'The agent could not answer.', type: 'turn.fail' },
    } satisfies Record<machines.guide.Event['type'], machines.guide.Event>

    // The save actor's results, which the runner never sends.
    const settled = [
      { output: '/docs/pages/overview-k3f9a2', type: 'xstate.done.actor.save' },
      { error: new Error('This site has no storage.'), type: 'xstate.error.actor.save' },
    ] as const
    // At most one page with one block keeps the graph finite.
    const size = (snapshot: machines.guide.Snapshot) =>
      `${snapshot.context.pages.length}/${snapshot.context.pages[0]?.blocks.length ?? 0}`
    const machine = machines.guide.provide({
      actors: { save: fromPromise(() => new Promise<string>(() => {})) },
    })
    const paths = getShortestPaths(machine, {
      events: (snapshot) => [
        ...Object.values(events).filter(
          (event) =>
            snapshot.can(event) &&
            !(event.type === 'page.create' && snapshot.context.pages.length > 0) &&
            !(event.type === 'block.insert' && size(snapshot) !== '1/0') &&
            // Storage turns available once.
            !(event.type === 'agent.ready' && snapshot.context.storage === 'available'),
        ),
        // Actor results are internal events, outside the machine's `Event` type.
        ...(snapshot.value === 'saving' ? (settled as unknown as machines.guide.Event[]) : []),
      ],
      serializeState: (snapshot) =>
        `${String(snapshot.value)} ${size(snapshot)} ${snapshot.context.storage}`,
    })

    for (const event of Object.values(events))
      expect(
        paths.some((path) => path.state.can(event)),
        event.type,
      ).toBe(true)
    // A guide holds an error exactly when it failed, and a link exactly when it is saved.
    for (const path of paths) {
      const state = machines.guideState(path.state)
      expect(state.error !== undefined, state.status).toBe(
        state.status === 'failed' || state.status === 'saveFailed',
      )
      expect(state.link !== undefined, state.status).toBe(state.status === 'saved')
    }
    expect(
      paths.map(
        (path) =>
          `${path.steps.map((step) => step.event.type).join(' → ')} = ${String(path.state.value)} ${size(path.state)}`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "xstate.init = generating 0/0",
        "xstate.init → agent.fail = failed 0/0",
        "xstate.init → agent.ready = generating 0/0",
        "xstate.init → guide.cancel = cancelled 0/0",
        "xstate.init → page.create = generating 1/0",
        "xstate.init → turn.complete = ready 0/0",
        "xstate.init → agent.fail → agent.ready = failed 0/0",
        "xstate.init → agent.fail → guide.refine = refining 0/0",
        "xstate.init → agent.ready → guide.cancel = cancelled 0/0",
        "xstate.init → agent.ready → page.create = generating 1/0",
        "xstate.init → agent.ready → turn.complete = ready 0/0",
        "xstate.init → page.create → agent.fail = failed 1/0",
        "xstate.init → page.create → block.insert = generating 1/1",
        "xstate.init → page.create → guide.cancel = cancelled 1/0",
        "xstate.init → page.create → turn.complete = ready 1/0",
        "xstate.init → agent.fail → agent.ready → guide.refine = refining 0/0",
        "xstate.init → agent.fail → guide.refine → page.create = refining 1/0",
        "xstate.init → agent.ready → page.create → agent.fail = failed 1/0",
        "xstate.init → agent.ready → page.create → block.insert = generating 1/1",
        "xstate.init → agent.ready → page.create → guide.cancel = cancelled 1/0",
        "xstate.init → agent.ready → page.create → turn.complete = ready 1/0",
        "xstate.init → page.create → block.insert → agent.fail = failed 1/1",
        "xstate.init → page.create → block.insert → guide.cancel = cancelled 1/1",
        "xstate.init → page.create → block.insert → turn.complete = ready 1/1",
        "xstate.init → agent.fail → agent.ready → guide.refine → page.create = refining 1/0",
        "xstate.init → agent.fail → guide.refine → page.create → block.insert = refining 1/1",
        "xstate.init → agent.ready → page.create → block.insert → agent.fail = failed 1/1",
        "xstate.init → agent.ready → page.create → block.insert → guide.cancel = cancelled 1/1",
        "xstate.init → agent.ready → page.create → block.insert → turn.complete = ready 1/1",
        "xstate.init → agent.ready → page.create → turn.complete → guide.save = saving 1/0",
        "xstate.init → agent.fail → agent.ready → guide.refine → page.create → block.insert = refining 1/1",
        "xstate.init → agent.ready → page.create → block.insert → turn.complete → guide.save = saving 1/1",
        "xstate.init → agent.ready → page.create → turn.complete → guide.save → xstate.done.actor.save = saved 1/0",
        "xstate.init → agent.ready → page.create → turn.complete → guide.save → xstate.error.actor.save = saveFailed 1/0",
        "xstate.init → agent.ready → page.create → block.insert → turn.complete → guide.save → xstate.done.actor.save = saved 1/1",
        "xstate.init → agent.ready → page.create → block.insert → turn.complete → guide.save → xstate.error.actor.save = saveFailed 1/1",
      ]
    `)
  })
})
