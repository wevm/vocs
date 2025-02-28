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
  sponsors: [
    {
      name: 'Collaborator',
      height: 120,
      items: [
        [
          {
            name: 'Paradigm',
            link: 'https://paradigm.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/paradigm-light.svg',
          },
          {
            name: 'Ithaca',
            link: 'https://ithaca.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/ithaca-light.svg',
          },
        ],
      ],
    },
    {
      name: 'Large Enterprise',
      height: 60,
      items: [
        [
          {
            name: 'Stripe',
            link: 'https://www.stripe.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/stripe-light.svg',
          },
          {
            name: 'ZKsync',
            link: 'https://zksync.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/zksync-light.svg',
          },
        ],
        [
          {
            name: 'Linea',
            link: 'https://linea.build',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/linea-light.svg',
          },
          {
            name: 'Routescan',
            link: 'https://routescan.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/routescan-light.svg',
          },
        ],
      ],
    },
    {
      name: 'Small Enterprise',
      height: 40,
      items: [
        [
          {
            name: 'Family',
            link: 'https://twitter.com/family',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/family-light.svg',
          },
          {
            name: 'Context',
            link: 'https://twitter.com/context',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/context-light.svg',
          },
          {
            name: 'WalletConnect',
            link: 'https://walletconnect.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/walletconnect-light.svg',
          },
          {
            name: 'PartyDAO',
            link: 'https://twitter.com/prtyDAO',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/partydao-light.svg',
          },
        ],
        [
          {
            name: 'SushiSwap',
            link: 'https://www.sushi.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/sushi-light.svg',
          },
          {
            name: 'Dynamic',
            link: 'https://www.dynamic.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/dynamic-light.svg',
          },
          {
            name: 'Privy',
            link: 'https://privy.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/privy-light.svg',
          },
          {
            name: 'PancakeSwap',
            link: 'https://pancakeswap.finance/',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/pancake-light.svg',
          },
        ],
        [
          {
            name: 'Celo',
            link: 'https://celo.org',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/celo-light.svg',
          },
          {
            name: 'Rainbow',
            link: 'https://rainbow.me',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/rainbow-light.svg',
          },
          {
            name: 'Pimlico',
            link: 'https://pimlico.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/pimlico-light.svg',
          },
          {
            name: 'Zora',
            link: 'https://zora.co',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/zora-light.svg',
          },
        ],
        [
          {
            name: 'Lattice',
            link: 'https://lattice.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/lattice-light.svg',
          },
          {
            name: 'Supa',
            link: 'https://twitter.com/supafinance',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/supa-light.svg',
          },
          {
            name: 'Syndicate',
            link: 'https://syndicate.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/syndicate-light.svg',
          },
          {
            name: 'Reservoir',
            link: 'https://reservoir.tools',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/reservoir-light.svg',
          },
        ],
        [
          {
            name: 'Uniswap',
            link: 'https://uniswap.org',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/uniswap-light.svg',
          },
          {
            name: 'Biconomy',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/biconomy-light.svg',
            link: 'https://biconomy.io',
          },
          {
            name: 'Thirdweb',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/thirdweb-light.svg',
            link: 'https://thirdweb.com',
          },
          {
            name: 'Polymarket',
            link: 'https://polymarket.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/polymarket-light.svg',
          },
        ],
        [
          {
            name: 'Sequence',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/sequence-light.svg',
            link: 'https://sequence.xyz',
          },
          {
            name: '',
            link: 'https://github.com/sponsors/wevm',
            image: '',
          },
          {
            name: '',
            link: 'https://github.com/sponsors/wevm',
            image: '',
          },
          {
            name: '',
            link: 'https://github.com/sponsors/wevm',
            image: '',
          },
        ],
      ],
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
