/**
 * End-to-end coverage of the handler's boundaries in custom mode: the model gateway forwards only
 * configured models and bounded bodies, the agent settings point at the built sources, and the
 * render route returns highlighted code or the reason it does not render.
 * @module
 */
import { expect, test } from '../Playwright.js'

test('refuses a model the config does not serve', async ({ request }) => {
  const response = await request.post('/docs/model/responses', {
    data: { input: [], model: 'gpt-6-astra' },
  })
  expect(response.status()).toBe(400)
  expect(await response.text()).toBe('Model "gpt-6-astra" is not served. Use one of: gpt-6-luna.')
})

test('refuses a body larger than the limit', async ({ request }) => {
  const response = await request.post('/docs/model/responses', {
    data: { input: 'x'.repeat(2_000_001), model: 'gpt-6-luna' },
  })
  expect(response.status()).toBe(413)
})

test('points the agent at the built sources', async ({ request }) => {
  const agent = await (await request.get('/docs/agent')).json()
  expect(agent).toMatchObject({ model: 'gpt-6-luna', title: 'Tempo', twoslash: ['viem'] })
  expect(agent.corpus).toMatch(/^\/assets\/vocs-corpus-[0-9a-f]{64}\.json$/)

  const corpus = await (await request.get(agent.corpus)).json()
  expect(Object.keys(corpus.files)).toEqual([
    '/sources/playground/docs/accounts.md',
    '/sources/playground/docs/fees.md',
    '/sources/playground/docs/memos.md',
  ])
})

test('renders code, and returns why a snippet does not render', async ({ request }) => {
  const render = async (data: object) =>
    (await request.post('/docs/render', { data })).json() as Promise<{
      error?: string
      html?: string
    }>

  const plain = await render({ code: 'echo memo\n', lang: 'bash' })
  expect(plain.html).toMatch(/^<span class="line"><span style="color:var\(--vocs-code-/)

  const unknown = await render({ code: 'memo', lang: 'toString' })
  expect(unknown.html).toBe('<span class="line"><span>memo</span></span>')

  const unsupported = await render({ code: 'echo memo', lang: 'bash', twoslash: true })
  expect(unsupported).toEqual({
    error:
      'Twoslash checks only `ts` and `tsx` blocks, not `bash`. Remove `twoslash`, or change the language.',
  })

  const mistyped = await render({
    code: "import { http } from 'viem'\nhttp(42)",
    lang: 'ts',
    twoslash: true,
  })
  expect(mistyped.error).toContain(
    "[2345] 33 - Argument of type 'number' is not assignable to parameter of type 'string'.",
  )

  const response = await request.post('/docs/render', { data: { code: 1, lang: 'ts' } })
  expect(response.status()).toBe(400)
})
