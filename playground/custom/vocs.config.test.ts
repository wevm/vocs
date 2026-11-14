/**
 * The end-to-end config: local Markdown only, and the stand-in model through the `MODEL` service
 * binding of `wrangler.test.jsonc`.
 * @module
 */
import { defineConfig, Provider, Source } from 'vocs'

export default defineConfig({
  description: 'Tempo is a payments blockchain.',
  provider: Provider.from({
    complete(body, context) {
      const model = context.env.MODEL as { fetch: typeof fetch }
      return model.fetch('https://model.test/responses', {
        body,
        headers: { accept: 'text/event-stream', 'content-type': 'application/json' },
        method: 'POST',
        signal: context.signal,
      })
    },
    models: ['gpt-6-luna'],
  }),
  sources: [Source.files({ include: 'docs/**/*.md', name: 'playground' })],
  title: 'Tempo',
  twoslash: { packages: ['viem'] },
})
