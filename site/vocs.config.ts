import { Changelog, defineConfig, Twoslash } from 'vocs/config'

export default defineConfig({
  title: 'Docs',
  changelog: Changelog.github({ repo: 'paradigmxyz/reth' }),
  twoslash: {
    transformers: [Twoslash.experimental_rust()],
  },
  sidebar: [
    {
      text: 'Welcome',
      link: '/',
    },
    {
      text: 'Changelog',
      link: '/changelog',
    },
  ],
})
