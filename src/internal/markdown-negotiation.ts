/**
 * Shared user-agent lists and content negotiation used to decide whether a
 * request for a documentation route should be served as Markdown instead of
 * HTML. Consumed by the Waku `.md` router middleware and the standalone
 * `Handler.openApi` server so both honor the same rules.
 */

/** AI crawlers/agents that should receive Markdown. */
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
  'FacebookBot',
  'meta-externalagent',
  'Bytespider',
  'cohere-ai',
  'AI2Bot',
  'CCBot',
  'Diffbot',
  'omgili',
  'Timpibot',
  'MistralAI-User',
  'GoogleAgent-Mariner',
]

/** Search engine crawlers that should always receive HTML. */
export const searchEngineUserAgents = [
  'Googlebot',
  'Bingbot',
  'Amazonbot',
  'Applebot',
  'Applebot-Extended',
  'DuckAssistBot',
  'YouBot',
]

/** Terminal HTTP clients that should receive Markdown. */
export const terminalUserAgents = ['curl/', 'Wget/', 'HTTPie/', 'httpie-go/', 'xh/']

/** Link-preview/Open Graph bots that must always receive HTML (for meta tags). */
export const ogBotUserAgents = [
  'Discordbot',
  'Embedly',
  'Facebot',
  'Iframely',
  'LinkedInBot',
  'Pinterestbot',
  'Slackbot',
  'Slurp',
  'TelegramBot',
  'Twitterbot',
  'WhatsApp',
  'facebookexternalhit',
]

/**
 * Decides whether a route request should be served as Markdown.
 *
 * Resolution order (matches the `.md` router middleware):
 * 1. Open Graph bots never get Markdown (they need HTML meta tags).
 * 2. An explicit `.md` suffix always serves Markdown.
 * 3. Search engines otherwise always get HTML.
 * 4. AI agents, terminal clients, or `Accept: text/markdown` get Markdown.
 * 5. Everything else gets HTML.
 */
export function prefersMarkdown(options: prefersMarkdown.Options): boolean {
  const { pathname, userAgent = '', accept = '' } = options

  if (ogBotUserAgents.some((agent) => userAgent.includes(agent))) return false
  if (pathname.endsWith('.md')) return true
  if (searchEngineUserAgents.some((agent) => userAgent.includes(agent))) return false

  const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))
  const isTerminal = terminalUserAgents.some((agent) => userAgent.includes(agent))
  const acceptsMarkdown = accept.includes('text/markdown')
  return isAiAgent || isTerminal || acceptsMarkdown
}

export declare namespace prefersMarkdown {
  type Options = {
    /** Request pathname (used to detect an explicit `.md` suffix). */
    pathname: string
    /** Request `User-Agent` header. */
    userAgent?: string | undefined
    /** Request `Accept` header. */
    accept?: string | undefined
  }
}
