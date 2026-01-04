import type { IncomingMessage, ServerResponse } from 'node:http'
import { createRequest } from '@remix-run/node-fetch-server'

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

export async function fromRequest(
  request: Request,
): Promise<{ content: string; contentType: string } | undefined> {
  const url = new URL(request.url)

  const userAgent = request.headers.get('user-agent') ?? ''
  const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))

  const isTxtRequest = url.pathname.endsWith('.txt')
  const isMarkdownRequest = url.pathname.endsWith('.md') || isTxtRequest
  if (!isMarkdownRequest && !isAiAgent) return

  const pathname = url.pathname.replace(/\.txt$/, '.md')
  const assetUrl = new URL(`/assets/md${pathname}`, url.origin)
  const response = await fetch(assetUrl)
  if (!response.ok) return

  const content = await response.text().catch(() => undefined)
  if (!content) return

  const contentType = isTxtRequest ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8'
  return { content, contentType }
}

export async function fromRequestListener(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<{ content: string; contentType: string } | undefined> {
  return fromRequest(createRequest(req, res))
}
