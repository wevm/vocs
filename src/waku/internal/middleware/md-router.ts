import * as path from 'node:path'
import type { MiddlewareHandler } from 'hono'
import * as Config from '../../../internal/config.js'
import * as Llms from '../../../internal/llms.js'
import * as Mdx from '../../../internal/mdx.js'

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

export const terminalUserAgents = ['curl/', 'Wget/', 'HTTPie/', 'httpie-go/', 'xh/']

async function resolveContent() {
  const config = await Config.resolve({ server: true })
  const { rehypePlugins, remarkPlugins } = Mdx.getCompileOptions('txt', config)
  const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir)
  const pages = await Llms.getPagesFromDir(pagesDir)
  return Llms.buildLlmsContent({
    pages,
    title: config.title,
    description: config.description,
    rehypePlugins,
    remarkPlugins,
  })
}

export function middleware(): MiddlewareHandler {
  return async (context, next) => {
    const url = new URL(context.req.url)

    const userAgent = context.req.header('user-agent') ?? ''
    const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))
    const isTerminal = terminalUserAgents.some((agent) => userAgent.includes(agent))
    const acceptHeader = context.req.header('accept') ?? ''
    const acceptsMarkdown = acceptHeader.includes('text/markdown')

    if (url.pathname === '/' && (acceptsMarkdown || isTerminal)) {
      const content = await resolveContent()
      context.res = new Response(content.short, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      })
      return
    }

    const isMarkdownRequest = url.pathname.endsWith('.md')
    if (!isMarkdownRequest && !isAiAgent && !isTerminal) return next()

    const pagePath = url.pathname.replace(/\.md$/, '').replace(/\/index$/, '')
    const content = await resolveContent()
    const result = content.results.find(
      (r) => r.path.replace(/\/$/, '') === pagePath.replace(/\/$/, ''),
    )
    if (!result) return next()

    context.res = new Response(result.content, {
      headers: {
        'Content-Type': `${url.pathname.endsWith('.txt') ? 'text/plain' : 'text/markdown'}; charset=utf-8`,
      },
    })
    return
  }
}

export default middleware
