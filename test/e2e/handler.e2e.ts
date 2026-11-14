/**
 * End-to-end coverage of the handler's boundaries in custom mode: the model gateway forwards only
 * configured models and bounded bodies, and the agent settings point at the built sources.
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
  expect(agent).toMatchObject({ model: 'gpt-6-luna', title: 'Tempo' })
  expect(agent.corpus).toMatch(/^\/assets\/vocs-corpus-[0-9a-f]{64}\.json$/)

  const corpus = await (await request.get(agent.corpus)).json()
  expect(Object.keys(corpus.files)).toEqual([
    '/sources/playground/docs/accounts.md',
    '/sources/playground/docs/fees.md',
    '/sources/playground/docs/memos.md',
  ])
})
