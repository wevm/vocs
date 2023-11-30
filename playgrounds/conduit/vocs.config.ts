import { defineConfig } from '../../src/index.js'

export default defineConfig({
  sidebar: [
    {
      text: 'Overview',
      link: '/',
    },
    {
      text: 'Getting Started',
      items: [
        {
          text: 'OP Stack',
          link: '/getting-started/op-stack',
        },
        {
          text: 'Arbitrum Nitro',
          link: '/getting-started/arbitrum-nitro',
        },
        {
          text: 'Get Access Keys',
          link: '/getting-started/get-access-keys',
        },
        {
          text: 'Upgrade Billing',
          link: '/getting-started/upgrade-billing',
        },
        {
          text: 'Adding Teammates',
          link: '/getting-started/adding-teammates',
        },
      ],
    },
    {
      text: 'Guides',
      items: [
        {
          text: 'Tracing Transactions',
          link: '/guides/tracing-transactions',
        },
        {
          text: 'Smart Contract Verification',
          link: '/guides/smart-contract-verification',
        },
      ],
    },
    {
      text: 'Resources',
      items: [
        {
          text: 'Bridge UI',
          link: '/resources/bridge-ui',
        },
        {
          text: 'Alterative Data Availability',
          link: '/resources/alt-da',
        },
        {
          text: 'Native Gas Tokens',
          link: '/resources/native-gas-tokens',
        },
      ],
    },
  ],
  logoUrl: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  },
  title: 'Conduit',
  topNav: [
    {
      text: 'Company',
      children: [
        {
          text: 'About',
          link: '/about',
        },
        {
          text: 'Blog',
          link: '/about',
        },
        {
          text: 'Careers',
          link: '/about',
        },
      ],
    },
  ],
})
