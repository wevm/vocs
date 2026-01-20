import { Changelog, defineConfig, McpSource, Twoslash } from 'vocs/config'
import { version } from '../package.json'

export default defineConfig({
  banner: 'Vocs v2 is now available!',
  changelog: Changelog.github({ repo: 'wevm/vocs' }),
  checkDeadlinks: true,
  description: 'Vocs is a library for creating documentation websites.',
  editLink: {
    link: 'https://github.com/wevm/vocs/edit/main/site/src/pages/:path',
  },
  iconUrl: {
    light: '/icon-light.svg',
    dark: '/icon-dark.svg',
  },
  logoUrl: {
    light: '/logo-tight-light.svg',
    dark: '/logo-tight-dark.svg',
  },
  mcp: {
    enabled: true,
    sources: [McpSource.github({ repo: 'wevm/vocs' })],
  },
  redirects: [],
  sidebar: [
    {
      text: 'Welcome',
      link: '/',
    },
    {
      text: 'Changelog',
      link: '/guide/changelog',
    },
  ],
  socials: [
    { icon: 'github', link: 'https://github.com/wevm/vocs' },
    { icon: 'x', link: 'https://twitter.com/wevm_dev' },
    { icon: 'discord', link: 'https://discord.gg/JUrRkGweXV' },
  ],
  title: 'Vocs',
  titleTemplate: '%s – Vocs',
  topNav: [
    { text: 'Guide', link: '/guide/what-is-vocs', match: '/guide' },
    { text: 'Reference', link: '/reference/site-config', match: '/reference' },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Changelog',
          link: '/changelog',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/wevm/vocs/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
  twoslash: {
    transformers: [Twoslash.experimental_rust()],
  },
})
