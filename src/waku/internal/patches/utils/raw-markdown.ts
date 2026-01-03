import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { config } from 'virtual:vocs/config'

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

type RawContentResult = { content: string; contentType: string } | null

export async function getMarkdownForPath(request: Request): Promise<RawContentResult> {
  const url = new URL(request.url)

  const userAgent = request.headers.get('user-agent') ?? ''
  const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))

  const isTextRequest = url.pathname.endsWith('.txt')
  if (!isTextRequest && !isAiAgent) return null

  const pagePath = isTextRequest ? url.pathname.slice(0, -4) : url.pathname
  const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir)

  const possiblePaths = [
    path.join(pagesDir, `${pagePath}.md`),
    path.join(pagesDir, `${pagePath}.mdx`),
    path.join(pagesDir, pagePath, 'index.md'),
    path.join(pagesDir, pagePath, 'index.mdx'),
  ]

  for (const filePath of possiblePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { content, contentType: 'text/plain; charset=utf-8' }
    } catch {}
  }

  return null
}
