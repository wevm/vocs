/**
 * Stand-in model server for end-to-end tests. It speaks the OpenAI Responses streaming
 * protocol that nanocode's Codex harness sends, and replays one scripted turn: the first
 * request searches the workspace with `rg`, and the request with the search output answers
 * with the matched paths. The same request always produces the same response.
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

    const events = (() => {
      if (last.type === 'custom_tool_call_output') return answer(output(last.output))
      return search(prompt(body.input))
    })()

    return new Response(stream(events), {
      headers: { 'cache-control': 'no-cache', 'content-type': 'text/event-stream' },
    })
  },
}

/** Returns the events of a turn that runs one `rg` search in a Code Mode cell. */
function search(text: string): readonly Event[] {
  const term = (text.match(/[A-Za-z][\w-]{3,}/g) ?? ['docs']).reduce((longest, word) =>
    word.length > longest.length ? word : longest,
  )
  const item = {
    call_id: 'call_search',
    id: 'ctc_search',
    input: `const result = await tools.exec_command({ cmd: ${JSON.stringify(`rg -n -i ${term} /`)} })\ntext(result.output)`,
    name: 'exec',
    type: 'custom_tool_call',
  }
  return [
    { response: response('resp_search', 'in_progress', []), type: 'response.created' },
    {
      item: { ...item, input: '', status: 'in_progress' },
      output_index: 0,
      type: 'response.output_item.added',
    },
    { item: { ...item, status: 'completed' }, output_index: 0, type: 'response.output_item.done' },
    {
      response: response('resp_search', 'completed', [{ ...item, status: 'completed' }]),
      type: 'response.completed',
    },
  ]
}

/** Returns the events of a message that cites each path in the search output. */
function answer(output: string): readonly Event[] {
  const paths = [...new Set(output.match(/\/[\w./-]+\.mdx?/g) ?? [])]
  const text = paths.length
    ? `Found in ${paths.length} file${paths.length === 1 ? '' : 's'}: ${paths.join(', ')}`
    : 'No file matches the question.'
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
