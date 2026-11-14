import { defineConfig, Provider, Source } from 'vocs'

export default defineConfig({
  description: 'Tempo is a payments blockchain.',
  provider: Provider.cloudflare({ gateway: 'vocs', models: ['gpt-6-luna'] }),
  sources: [
    Source.github({
      name: 'docs',
      paths: ['**/*.md', '**/*.mdx'],
      ref: 'e8f91d41f1e15bdd09da6d70c5f0ca5188b34bdd',
      repo: 'tempoxyz/docs',
    }),
    Source.github({
      name: 'tips',
      paths: 'tips/**/*.md',
      ref: '35d8b937fba89ae0bfdea1edf735fb6f8aa41c23',
      repo: 'tempoxyz/tempo',
    }),
    Source.github({
      name: 'viem',
      paths: 'site/pages/tempo/**/*.{md,mdx}',
      ref: '8d3f29e03333d40283811dc69dbd02cdee2bd354',
      repo: 'wevm/viem',
    }),
  ],
  title: 'Tempo',
  twoslash: { packages: ['viem', 'viem/tempo'] },
})
