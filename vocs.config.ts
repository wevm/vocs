import { defineConfig } from './src/index.js'
import { version } from './src/package.json'

export default defineConfig({
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
  root: 'site',
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
      text: 'Overview',
      link: '/',
    },
    {
      text: 'Kitchen Sink',
      link: '/kitchen-sink',
    },
    {
      text: 'API',
      items: [
        {
          text: 'defineConfig',
          link: '/api/defineConfig',
        },
      ],
    },
    {
      text: 'Item 1.0',
      collapsed: false,
      items: [
        {
          text: 'Item 1.1',
          link: '/test/itema',
        },
        {
          text: 'Item 1.2',
          link: '/test/itemb',
          items: [
            {
              text: 'Item 1.2.1',
              link: '/test/itemc',
            },
            {
              text: 'Item 1.2.2',
              link: '/test/itemd',
              collapsed: false,
              items: [
                {
                  text: 'Item 1.2.2.1',
                  link: '/test/iteme',
                },
                {
                  text: 'Item 1.2.2.2',
                  link: '/test/itemf',
                },
              ],
            },
            {
              text: 'Item 1.2.3',
              link: '/test/itemg',
            },
          ],
        },
        {
          text: 'Item 1.3',
          link: '/test/itemh',
        },
        {
          text: 'Item 1.4',
          link: '/test/itemi',
        },
      ],
    },
    {
      text: 'Item 2.0',
      items: [
        {
          text: 'Item 2.1',
          link: '/test/itemj',
        },
        {
          text: 'Item 2.2',
          link: '/test/itemk',
        },
      ],
    },
  ],
  title: 'Vocs',
  topNav: [
    { text: 'Guide & API', link: '/' },
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
