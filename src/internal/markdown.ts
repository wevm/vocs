import * as fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import * as path from 'node:path'
import { createRequest } from '@remix-run/node-fetch-server'

const aiUserAgents = [
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

export async function fromRequest(request: Request, dir: string): Promise<string | undefined> {
  const url = new URL(request.url)

  const userAgent = request.headers.get('user-agent') ?? ''
  const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))

  const isMarkdownRequest = url.pathname.endsWith('.md')
  if (!isMarkdownRequest && !isAiAgent) return

  const pagePath = isMarkdownRequest ? url.pathname.slice(0, -3) : url.pathname

  const possiblePaths = [
    path.join(dir, `${pagePath}.md`),
    path.join(dir, `${pagePath}.mdx`),
    path.join(dir, pagePath, 'index.md'),
    path.join(dir, pagePath, 'index.mdx'),
  ]

  for (const filePath of possiblePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return content
    } catch {}
  }

  return
}

export async function fromRequestListener(
  req: IncomingMessage,
  res: ServerResponse,
  dir: string,
): Promise<string | undefined> {
  return fromRequest(createRequest(req, res), dir)
}
