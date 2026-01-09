import { defineConfig } from 'vocs/config'

export default defineConfig({
  baseUrl: process.env.BASE_URL,
  checkDeadlinks: false,
  redirects: [
    { source: '/ks', destination: '/kitchen-sink' },
    { source: '/docs/:path*', destination: '/:path*' },
    { source: '/old-page', destination: '/kitchen-sink', status: 301 },
  ],
  description: 'Vocs is a library for creating documentation websites.',
  editLink: {
    link: 'https://github.com/wevm/vocs/edit/next/playground/src/pages/:path',
  },
  logoUrl: {
    light: '/logo-tight-light.svg',
    dark: '/logo-tight-dark.svg',
  },
  iconUrl: {
    light: '/icon-light.svg',
    dark: '/icon-dark.svg',
  },
  topNav: [
    { text: 'Docs', link: '/' },
    { text: 'Sub', link: '/sub/links', match: '/sub' },
    { text: 'External Link', link: 'https://viem.sh' },
    {
      text: 'Extensions',
      items: [
        {
          text: 'Twoslash',
          link: '/twoslash',
        },
        {
          text: 'Account Abstraction',
          link: '/account-abstraction',
        },
        {
          text: 'OP Stack',
          link: '/op-stack',
        },
        {
          text: 'USDC (Circle)',
          link: '/circle-usdc',
        },
        {
          text: 'ZKsync',
          link: '/zksync',
        },
        {
          text: 'Experimental',
          link: '/experimental',
        },
      ],
    },
  ],
  socials: [
    { icon: 'discord', link: 'https://discord.gg/JUrRkGweXV' },
    { icon: 'github', link: 'https://github.com/wevm/vocs' },
    { icon: 'x', link: 'https://twitter.com/wevm_dev' },
  ],
  title: 'Vocs',
  titleTemplate: '%s – Vocs',
  sidebar: {
    '/': [
      { text: 'Home', link: '/' },
      { text: 'Kitchen Sink', link: '/kitchen-sink' },
      { text: 'REPL', link: '/repl' },
      { text: 'None' },
      {
        text: 'Concepts',
        collapsed: false,
        items: [
          { text: 'Wallet Client', link: '/wallet-client' },
          { text: 'External Link', link: 'https://viem.sh' },
          { text: 'Tempo Actions', link: '/tempo-actions' },
        ],
      },
      // {
      //   text: 'Components',
      //   link: '/docs/components',
      //   collapsed: true,
      //   items: [
      //     { text: 'Callouts', link: '/docs/components/callouts' },
      //     { text: 'Tabs', link: '/docs/components/tabs' },
      //     { text: 'Steps', link: '/docs/components/steps' },
      //     { text: 'Code Groups', link: '/docs/components/code-groups' },
      //     {
      //       text: 'Forms',
      //       link: '/docs/components/forms',
      //       items: [
      //         { text: 'Input', link: '/docs/components/forms/input' },
      //         { text: 'Select', link: '/docs/components/forms/select' },
      //         {
      //           text: 'Validation',
      //           link: '/docs/components/forms/validation',
      //           items: [
      //             { text: 'Required', link: '/docs/components/forms/validation/required' },
      //             { text: 'Pattern', link: '/docs/components/forms/validation/pattern' },
      //           ],
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   text: 'Advanced',
      //   collapsed: true,
      //   items: [
      //     { text: 'Deployment', link: '/docs/advanced/deployment' },
      //     { text: 'SEO', link: '/docs/advanced/seo' },
      //     { text: 'Customization', link: '/docs/advanced/customization' },
      //     { text: 'Internationalization', link: '/docs/advanced/i18n', disabled: true },
      //   ],
      // },
    ],
    '/sub/': {
      backLink: true,
      items: [
        {
          text: 'API Reference',
          items: [
            { text: 'Links', link: '/sub/links' },
            { text: 'defineConfig', link: '/api/define-config' },
            { text: 'CLI', link: '/api/cli' },
            { text: 'Hooks', link: '/api/hooks' },
          ],
        },
      ],
    },
  },
})
