import type { MiddlewareHandler } from 'hono'

export const aiUserAgents = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ChatGPT-User/2.0',
  'anthropic-ai',
  'ClaudeBot',
  'claude-web',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Googlebot',
  'Bingbot',
  'Amazonbot',
  'Applebot',
  'Applebot-Extended',
  'FacebookBot',
  'meta-externalagent',
  'LinkedInBot',
  'Bytespider',
  'DuckAssistBot',
  'cohere-ai',
  'AI2Bot',
  'CCBot',
  'Diffbot',
  'omgili',
  'Timpibot',
  'YouBot',
  'MistralAI-User',
  'GoogleAgent-Mariner',
]

export function middleware(): MiddlewareHandler {
  return async (context, next) => {
    const url = new URL(context.req.url)

    const userAgent = context.req.header('user-agent') ?? ''
    const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))

    const isMarkdownRequest = url.pathname.endsWith('.md')
    if (!isMarkdownRequest && !isAiAgent) return next()

    const assetUrl = new URL(`/assets/md${url.pathname}`, url.origin)
    const response = await globalThis.fetch(assetUrl)
    if (!response.ok) return next()

    context.res = new Response(await response.text(), {
      headers: {
        'Content-Type': `${url.pathname.endsWith('.txt') ? 'text/plain' : 'text/markdown'}; charset=utf-8`,
      },
    })
    return
  }
}

export default middleware
