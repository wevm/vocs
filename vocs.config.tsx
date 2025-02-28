import * as React from 'react'

import { defineConfig } from './src/index.js'
import { version } from './src/package.json'

export default defineConfig({
  baseUrl: 'https://vocs.dev',
  description: 'Static documentation generator powered by Vite and React',
  editLink: {
    pattern: 'https://github.com/wagmi-dev/vocs/edit/main/site/pages/:path',
    text: 'Suggest changes to this page',
  },
  head() {
    return (
      <>
        <script src="https://cdn.usefathom.com/script.js" data-site="IBTUTKMT" defer />
      </>
    )
  },
  iconUrl: {
    light: '/vocs-icon-light.svg',
    dark: '/vocs-icon-dark.svg',
  },
  logoUrl: {
    light: '/vocs-logo-light.svg',
    dark: '/vocs-logo-dark.svg',
  },
  ogImageUrl: {
    '/': '/og.png',
    '/docs': 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
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
      text: 'Project Structure',
      link: '/docs/structure',
    },
    {
      text: 'Markdown Reference',
      link: '/docs/markdown',
    },
    {
      text: 'Guides',
      collapsed: false,
      items: [
        {
          text: 'Blog',
          link: '/docs/guides/blog',
        },
        {
          text: 'Code Snippets',
          link: '/docs/guides/code-snippets',
        },
        {
          text: 'Components',
          link: '/docs/guides/components',
        },
        {
          text: 'CSS & Styling',
          link: '/docs/guides/styling',
        },
        {
          text: 'Dynamic OG Images',
          link: '/docs/guides/og-images',
        },
        {
          text: 'Layouts',
          link: '/docs/guides/layouts',
        },
        {
          text: 'Markdown Snippets',
          link: '/docs/guides/markdown-snippets',
        },
        {
          text: 'Sidebar & Top Navigation',
          link: '/docs/guides/navigation',
        },
        {
          text: 'Theming',
          link: '/docs/guides/theming',
        },
        {
          text: 'Twoslash',
          link: '/docs/guides/twoslash',
        },
      ],
    },
    {
      text: 'API',
      collapsed: false,
      items: [
        {
          text: 'Config',
          link: '/docs/api/config',
        },
        {
          text: 'Frontmatter',
          link: '/docs/api/frontmatter',
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
      items: [
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
  twoslash: {
    compilerOptions: {
      paths: {
        // Source - reference source files so we don't need to build packages to get types (speeds things up)
        vocs: ['./src'],
        'vocs/*': ['./src/*'],
      },
    },
  },
})
