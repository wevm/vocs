/**
 * Stand-in model server for end-to-end tests. It speaks the OpenAI Responses streaming
 * protocol that nanocode's Codex harness sends, and replays scripted turns. Each turn runs one
 * Code Mode cell, chosen by the message prefix, then answers once the cell returns:
 *
 * - A question searches the workspace with `rg` and answers with the matched paths.
 * - `Write a page:` searches, then writes one page with the page tools. It first emits an
 *   invalid block and a Twoslash block with a type error, and writes whether both were rejected
 *   into the page.
 * - `Write docs:` writes three pages in two sidebar groups, with every block type and a Twoslash
 *   block that imports `viem`.
 * - `Revise:` removes the last block of the first page and adds a callout with the request.
 *
 * The same request always produces the same response.
 * @module
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method !== 'POST' || !url.pathname.endsWith('/responses'))
      return new Response('Not found', { status: 404 })

    const body = (await request.json()) as Body
    const last = body.input.at(-1)
    if (!last) return new Response('The request has no input.', { status: 400 })

    const text = prompt(body.input)
    const events = (() => {
      if (last.type === 'custom_tool_call_output') {
        if (/^(Write a page|Write docs|Revise):/.test(text)) return message('Wrote the pages.')
        return answer(output(last.output))
      }
      if (text.startsWith('Write a page:')) return cell(page(term(text)))
      if (text.startsWith('Write docs:')) return cell(docs)
      if (text.startsWith('Revise:')) return cell(revise(text.slice('Revise:'.length).trim()))
      return cell(search(term(text)))
    })()

    return new Response(stream(events), {
      headers: { 'cache-control': 'no-cache', 'content-type': 'text/event-stream' },
    })
  },
}

/** Returns the longest word of a message after its prefix, the term the scripts search for. */
function term(text: string): string {
  const words = text.replace(/^[^:]+:/, '').match(/[A-Za-z][\w-]{3,}/g) ?? ['docs']
  return words.reduce((longest, word) => (word.length > longest.length ? word : longest))
}

/** Returns the code of a cell that runs one `rg` search. */
function search(term: string): string {
  return `const result = await tools.exec_command({ cmd: ${JSON.stringify(`rg -n -i ${term} /`)} })\ntext(result.output)`
}

/** Returns the code of a cell that searches, then writes one page. */
function page(term: string): string {
  return `
const found = await tools.exec_command({ cmd: ${JSON.stringify(`rg -l -i ${term} /sources`)} })
const paths = found.output.match(/\\/sources\\/\\S+\\.md/g) ?? []
const { page } = await tools.page_create({ group: 'Guides', title: ${JSON.stringify(`Use ${term}`)} })
let rejection = ''
try {
  await tools.page_insert({ page, block: { type: 'callout', kind: 'loud', body: 'Invalid kind.' } })
} catch (error) {
  rejection = String(error)
}
try {
  await tools.page_insert({ page, block: { type: 'code', lang: 'ts', twoslash: true, code: "const memo: string = 42" } })
} catch (error) {
  rejection += String(error)
}
await tools.page_insert({ page, block: { type: 'prose', markdown: 'Read in ' + paths.map((path) => '\`' + path + '\`').join(', ') + '.' } })
await tools.page_insert({ page, block: { type: 'code', lang: 'ts', title: 'transfer.ts', code: ${JSON.stringify(`await client.token.${term}({ amount: 100n, memo: 'invoice-42', to: recipient })`)} } })
await tools.page_insert({ page, block: { type: 'callout', kind: 'note', title: 'Rejected block', body: rejection.includes('Invalid option') && rejection.includes('[2322]') ? 'The page tools rejected an invalid callout kind and a type error.' : 'No rejection: ' + rejection } })
text(page)`
}

/** The code of a cell that writes three pages in two groups, with every block type. */
const docs = `
const overview = (await tools.page_create({ group: 'Memos', title: 'Overview' })).page
const attach = (await tools.page_create({ group: 'Memos', title: 'Attach a Memo' })).page
const fees = (await tools.page_create({ group: 'Fees', title: 'Pay Fees in Stablecoins' })).page
await tools.page_insert({ page: overview, block: { type: 'prose', markdown: 'A memo is **32 bytes** stored with the transfer event. See [the spec](https://docs.tempo.xyz).' } })
await tools.page_insert({ page: overview, block: { type: 'cards', cards: [{ title: 'Attach a Memo', description: 'Send a transfer with a memo.' }, { title: 'Pay Fees', description: 'Pay fees in any stablecoin.' }] } })
await tools.page_insert({ page: attach, block: { type: 'steps', steps: [{ title: 'Install the SDK', body: 'Add \`viem\` to the project.' }, { title: 'Send the transfer', body: 'Call \`transferWithMemo\` with a memo.' }] } })
await tools.page_insert({ page: attach, block: { type: 'codeGroup', tabs: [{ title: 'npm', lang: 'bash', code: 'npm i viem' }, { title: 'pnpm', lang: 'bash', code: 'pnpm add viem' }] } })
await tools.page_insert({ page: attach, block: { type: 'heading', level: 2, text: 'Send the transfer' } })
await tools.page_insert({ page: attach, block: { type: 'code', lang: 'ts', title: 'client.ts', twoslash: true, code: "import { createClient, http } from 'viem'\\n\\nconst transport = http('https://rpc.tempo.xyz')\\n//    ^?\\nconst client = createClient({ transport })" } })
await tools.page_insert({ page: attach, block: { type: 'demo', name: 'memo' } })
await tools.page_insert({ page: attach, block: { type: 'fileTree', entries: [{ path: 'src' }, { path: 'src/transfer.ts', note: 'Sends the transfer' }, { path: 'package.json' }] } })
await tools.page_insert({ page: fees, block: { type: 'callout', kind: 'warning', title: 'Testnet only', body: 'Fee tokens are on testnet.' } })
await tools.page_insert({ page: fees, block: { type: 'terminal', commands: [{ command: 'cast send --fee-token USDC', output: 'status: success' }] } })
await tools.page_insert({ page: fees, block: { type: 'mermaid', diagram: 'flowchart LR\\n  Sender --> Fee[Fee token] --> Validator' } })
text('done')`

/** Returns the code of a cell that revises the first page. */
function revise(request: string): string {
  return `
const outline = await tools.page_read({})
const first = outline.pages[0]
await tools.page_remove({ page: first.page, index: first.blocks - 1 })
await tools.page_insert({ page: first.page, index: 0, block: { type: 'callout', kind: 'tip', body: ${JSON.stringify(`Revised: ${request}`)} } })
text('done')`
}

/** Returns the events of a turn that runs one Code Mode cell. */
function cell(code: string): readonly Event[] {
  const item = {
    call_id: 'call_cell',
    id: 'ctc_cell',
    input: code,
    name: 'exec',
    type: 'custom_tool_call',
  }
  return [
    { response: response('resp_cell', 'in_progress', []), type: 'response.created' },
    {
      item: { ...item, input: '', status: 'in_progress' },
      output_index: 0,
      type: 'response.output_item.added',
    },
    { item: { ...item, status: 'completed' }, output_index: 0, type: 'response.output_item.done' },
    {
      response: response('resp_cell', 'completed', [{ ...item, status: 'completed' }]),
      type: 'response.completed',
    },
  ]
}

/** Returns the events of a message that cites each path in the search output. */
function answer(output: string): readonly Event[] {
  const paths = [...new Set(output.match(/\/[\w./-]+\.mdx?/g) ?? [])]
  return message(
    paths.length
      ? `Found in ${paths.length} file${paths.length === 1 ? '' : 's'}: ${paths.join(', ')}`
      : 'No file matches the question.',
  )
}

/** Returns the events of an assistant message, streamed in chunks. */
function message(text: string): readonly Event[] {
  const chunks = text.match(/.{1,16}/g) ?? [text]
  const item = {
    content: [{ annotations: [], text, type: 'output_text' }],
    id: 'msg_answer',
    role: 'assistant',
    status: 'completed',
    type: 'message',
  }
  return [
    { response: response('resp_answer', 'in_progress', []), type: 'response.created' },
    {
      item: { ...item, content: [], status: 'in_progress' },
      output_index: 0,
      type: 'response.output_item.added',
    },
    {
      content_index: 0,
      item_id: item.id,
      output_index: 0,
      part: { annotations: [], text: '', type: 'output_text' },
      type: 'response.content_part.added',
    },
    ...chunks.map((delta) => ({
      content_index: 0,
      delta,
      item_id: item.id,
      output_index: 0,
      type: 'response.output_text.delta',
    })),
    {
      content_index: 0,
      item_id: item.id,
      output_index: 0,
      text,
      type: 'response.output_text.done',
    },
    {
      content_index: 0,
      item_id: item.id,
      output_index: 0,
      part: item.content[0],
      type: 'response.content_part.done',
    },
    { item, output_index: 0, type: 'response.output_item.done' },
    { response: response('resp_answer', 'completed', [item]), type: 'response.completed' },
  ]
}

/** Returns the text of a tool output, which is a string or a list of text parts. */
function output(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value.map((part: { text?: unknown }) => String(part.text ?? '')).join('')
}

/** Returns the text of the last user message. */
function prompt(input: Body['input']): string {
  const message = input.findLast((item) => item.type === 'message' && item.role === 'user')
  return (message?.content ?? []).map((part) => part.text ?? '').join(' ')
}

function response(id: string, status: string, output: readonly unknown[]) {
  return {
    id,
    object: 'response',
    output,
    status,
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  }
}

function stream(events: readonly Event[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const [index, event] of events.entries())
        controller.enqueue(
          encoder.encode(
            `event: ${event.type}\ndata: ${JSON.stringify({ ...event, sequence_number: index })}\n\n`,
          ),
        )
      controller.close()
    },
  })
}

type Body = {
  input: readonly {
    content?: readonly { text?: string | undefined }[] | undefined
    output?: unknown
    role?: string | undefined
    type: string
  }[]
}

type Event = Record<string, unknown> & { type: string }
