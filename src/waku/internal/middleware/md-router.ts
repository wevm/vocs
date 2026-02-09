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

export const terminalUserAgents = ['curl/', 'Wget/', 'HTTPie/', 'httpie-go/', 'xh/']

const isDev = process.env['NODE_ENV'] !== 'production'

async function resolveContent() {
  const path = await import('node:path')
  const Config = await import('../../../internal/config.js')
  const Llms = await import('../../../internal/llms.js')
  const Mdx = await import('../../../internal/mdx.js')

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

async function fetchMarkdown(url: URL, assetPath: string) {
  const assetUrl = new URL(assetPath, url.origin)
  const response = await globalThis.fetch(assetUrl)
  if (!response.ok) return null
  return response.text()
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
      let text: string | null
      if (isDev) {
        const content = await resolveContent()
        text = content.short
      } else {
        text = await fetchMarkdown(url, '/llms.txt')
      }
      if (!text) return next()

      context.res = new Response(text, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      })
      return
    }

    const isMarkdownRequest = url.pathname.endsWith('.md')
    if (!isMarkdownRequest && !isAiAgent && !isTerminal) return next()

    const pagePath = url.pathname.replace(/\.md$/, '').replace(/\/index$/, '')

    let text: string | null
    if (isDev) {
      const content = await resolveContent()
      const result = content.results.find(
        (r) => r.path.replace(/\/$/, '') === pagePath.replace(/\/$/, ''),
      )
      text = result?.content ?? null
    } else {
      const assetPath = url.pathname.endsWith('.md')
        ? `/assets/md${url.pathname}`
        : `/assets/md${url.pathname}.md`
      text = await fetchMarkdown(url, assetPath)
    }
    if (!text) return next()

    context.res = new Response(text, {
      headers: {
        'Content-Type': `${url.pathname.endsWith('.txt') ? 'text/plain' : 'text/markdown'}; charset=utf-8`,
      },
    })
    return
  }
}

export default middleware
