import type * as Config from './config.js'

/** Runtime configuration consumed by React components and browser code. */
export type ClientConfig = Omit<Config.Config, 'codeHighlight' | 'markdown' | 'twoslash'> & {
  codeHighlight: Pick<Config.Config['codeHighlight'], 'langAlias' | 'themes'>
}

/** Keep build-time plugins and language registrations out of browser payloads. */
export function from(config: Config.Config): ClientConfig {
  const { codeHighlight, markdown: _markdown, twoslash: _twoslash, ...runtime } = config
  return {
    ...runtime,
    codeHighlight: {
      langAlias: codeHighlight.langAlias,
      themes: codeHighlight.themes,
    },
  }
}
