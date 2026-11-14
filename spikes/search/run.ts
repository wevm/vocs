/**
 * Spike C. Creates a Cloudflare AI Search instance with `source` and `url` metadata, uploads the
 * corpus of the custom playground through the Items API, waits until every item leaves the queue, then runs ten
 * questions with a `source` filter and one with a filter that matches nothing. It deletes the
 * instance afterwards unless `KEEP=1`.
 *
 * Needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (AI Search Edit and Run), and
 * the corpus asset at the first argument, `playground/custom/dist/client/assets/vocs-corpus-<hash>.json`.
 * @module
 */
import * as Fs from 'node:fs/promises'

const account = required('CLOUDFLARE_ACCOUNT_ID')
const token = required('CLOUDFLARE_API_TOKEN')
const instance = `vocs-spike-${Date.now()}`
const base = `https://api.cloudflare.com/client/v4/accounts/${account}/ai-search/namespaces/default/instances`

const questions = [
  'How do I send a payment with a memo?',
  'What are fee tokens and how are fees paid?',
  'How do passkey accounts work?',
  'How do I get testnet funds?',
  'What is a TIP-20 token?',
  'How do I run a node?',
  'How do access keys limit what a signer can do?',
  'How do I sponsor fees for my users?',
  'What is the difference between mainnet and testnet?',
  'How do I accept stablecoin payments in my app?',
]

const corpus = (
  JSON.parse(await Fs.readFile(process.argv[2] ?? 'corpus.json', 'utf8')) as {
    files: Record<string, string>
  }
).files

await call('POST', '', {
  custom_metadata: [
    { data_type: 'text', field_name: 'source' },
    { data_type: 'text', field_name: 'url' },
  ],
  id: instance,
})
process.stdout.write(`Created ${instance}\n`)

try {
  const start = performance.now()
  const paths = Object.keys(corpus)
  for (let index = 0; index < paths.length; index += 6)
    await Promise.all(paths.slice(index, index + 6).map((path) => upload(path, corpus[path]!)))
  const uploaded = performance.now() - start
  process.stdout.write(`Uploaded ${paths.length} files in ${Math.round(uploaded)} ms\n`)

  for (;;) {
    const items = (await call('GET', '/items?per_page=100')) as readonly { status: string }[]
    const statuses = Object.groupBy(items, (item) => item.status)
    const pending = (statuses.queued?.length ?? 0) + (statuses.running?.length ?? 0)
    if (items.length >= paths.length && pending === 0) {
      process.stdout.write(
        `Indexed in ${Math.round(performance.now() - start)} ms: ${JSON.stringify(Object.fromEntries(Object.entries(statuses).map(([key, value]) => [key, value?.length])))}\n`,
      )
      break
    }
    if (performance.now() - start > 600_000)
      throw new Error('Indexing took longer than 10 minutes.')
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  for (const question of questions) {
    const searched = performance.now()
    const result = (await call('POST', '/search', {
      ai_search_options: { retrieval: { filters: { source: 'tempo' }, max_num_results: 3 } },
      query: question,
    })) as { chunks: readonly { item?: { key: string }; score: number }[] }
    const top = result.chunks
      .map((chunk) => `${chunk.item?.key} (${chunk.score.toFixed(2)})`)
      .join(', ')
    process.stdout.write(
      `${Math.round(performance.now() - searched)} ms  ${question}\n    ${top || 'no results'}\n`,
    )
  }

  const empty = (await call('POST', '/search', {
    ai_search_options: { retrieval: { filters: { source: 'other' } } },
    query: questions[0],
  })) as { chunks: readonly unknown[] }
  process.stdout.write(`Filter that matches nothing returned ${empty.chunks.length} chunks\n`)
} finally {
  if (process.env.KEEP !== '1') {
    await call('DELETE', '')
    process.stdout.write(`Deleted ${instance}\n`)
  }
}

async function upload(path: string, content: string) {
  const form = new FormData()
  // Built-in storage derives `folder` from the file name, so the corpus path stays in it.
  form.set('file', new File([content], path.slice(1).replace(/\.mdx$/, '.md')))
  form.set(
    'metadata',
    JSON.stringify({ source: 'tempo', url: `https://docs.tempo.xyz${path.slice('/docs'.length)}` }),
  )
  const response = await fetch(`${base}/${instance}/items`, {
    body: form,
    headers: { authorization: `Bearer ${token}` },
    method: 'POST',
  })
  if (!response.ok) throw new Error(`Uploading ${path} failed: ${await response.text()}`)
}

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(
    `${base}${path ? `/${instance}${path}` : method === 'POST' ? '' : `/${instance}`}`,
    {
      body: body ? JSON.stringify(body) : null,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      method,
    },
  )
  const json = (await response.json()) as { errors?: unknown; result?: unknown; success: boolean }
  if (!json.success)
    throw new Error(`${method} ${path || '/'} failed: ${JSON.stringify(json.errors)}`)
  return json.result
}

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Spike C needs a Cloudflare account and token.`)
  return value
}
