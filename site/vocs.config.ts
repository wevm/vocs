import { Changelog, defineConfig } from 'vocs/config'

export default defineConfig({
  title: 'Docs',
  changelog: Changelog.github({ repo: 'paradigmxyz/reth' }),
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
