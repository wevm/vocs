/**
 * The end-to-end config: local Markdown only, the stand-in model through the `MODEL` service
 * binding of `wrangler.test.jsonc`, and saved pages in its local `PAGES` KV namespace.
 * @module
 */
import { defineConfig, Provider, Source, Storage } from 'vocs'

export default defineConfig({
  demos: { memo: './src/demos/Memo.tsx' },
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
  storage: Storage.cloudflare({ binding: 'PAGES' }),
  title: 'Tempo',
  twoslash: { packages: ['viem'] },
})
