/**
 * Spike A Worker. It serves `POST /api/model/responses`, refuses other models and large bodies,
 * and forwards the request. With a `MODEL` service binding (tests), the stand-in model answers.
 * Otherwise the request goes to Cloudflare AI Gateway's OpenAI endpoint with the Worker's secrets.
 * @module
 */

const model = 'gpt-6-luna'
const maxBytes = 2_000_000

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/api/model/responses' || request.method !== 'POST')
      return new Response('Not found', { status: 404 })

    const body = await request.text()
    if (body.length > maxBytes) return new Response('The request is too large.', { status: 413 })
    if ((JSON.parse(body) as { model?: string }).model !== model)
      return new Response(`Only ${model} is served.`, { status: 400 })

    const headers = {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    }

    if (env.MODEL)
      return env.MODEL.fetch('https://model.test/responses', { body, headers, method: 'POST' })

    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_GATEWAY || !env.CLOUDFLARE_API_TOKEN)
      return new Response(
        'The Worker has no model upstream. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_GATEWAY, and CLOUDFLARE_API_TOKEN.',
        { status: 503 },
      )

    return fetch(
      `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY}/openai/responses`,
      {
        body,
        headers: { ...headers, 'cf-aig-authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
        method: 'POST',
        signal: request.signal,
      },
    )
  },
}

type Env = {
  CLOUDFLARE_ACCOUNT_ID?: string | undefined
  CLOUDFLARE_API_TOKEN?: string | undefined
  CLOUDFLARE_GATEWAY?: string | undefined
  MODEL?: { fetch(input: string, init: RequestInit): Promise<Response> } | undefined
}
