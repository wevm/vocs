import { defineConfig } from './src/index.js'
import { version } from './src/package.json'

export default defineConfig({
  baseUrl: 'https://vocs.dev',
  description: 'Static documentation generator powered by Vite and React',
  editLink: {
    pattern: 'https://github.com/wagmi-dev/vocs/edit/main/site/pages/:path',
    text: 'Edit on GitHub',
  },
  iconUrl: {
    light: '/vocs-icon-light.svg',
    dark: '/vocs-icon-dark.svg',
  },
  logoUrl: {
    light: '/vocs-logo-light.svg',
    dark: '/vocs-logo-dark.svg',
  },
  rootDir: 'site',
  socials: [
    {
      icon: 'discord',
      link: 'https://discord.gg/JUrRkGweXV',
    },
    {
      icon: 'github',
      link: 'https://github.com/wagmi-dev/vocs',
    },
    {
      icon: 'x',
      link: 'https://twitter.com/wagmi_sh',
    },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      link: '/docs',
    },
    {
      text: 'API',
      items: [
        {
          text: 'Config',
          link: '/docs/api/config',
        },
        {
          text: 'Frontmatter',
          link: '/docs/api/frontmatter',
        },
        {
          text: 'Markdown',
          link: '/docs/api/markdown',
        },
      ],
    },
  ],
  title: 'Vocs',
  topNav: [
    { text: 'Guide & API', link: '/docs' },
    { text: 'Blog', link: '/blog' },
    {
      text: version,
      children: [
        {
          text: 'Changelog',
          link: 'https://github.com/wevm/vocs/blob/main/src/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/wevm/vocs/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
})
