import { defineConfig } from '../../src/index.js'

export default defineConfig({
  logoUrl: {
    light: '/logo-light.png',
    dark: '/logo-dark.png',
  },
  sidebar: [
    {
      text: 'OP Stack',
      items: [
        {
          text: 'Welcome to the OP Stack',
          link: '/',
        },
        {
          text: 'Design Principles',
        },
        {
          text: 'The OP Stack Landscape',
        },
        {
          text: 'Superchain Explainer',
        },
      ],
    },
    {
      text: 'Releases',
      items: [
        {
          text: 'Release History',
        },
        {
          text: 'Bedrock',
          items: [
            {
              text: 'OP Stack Codebase V1 – Bedrock',
            },
            {
              text: 'Bedrock Explainer',
            },
            {
              text: 'Bedrock and L1 Ethereum',
            },
          ],
        },
      ],
    },
    {
      text: 'Building OP Stack Rollups',
      items: [
        {
          text: 'Getting Started',
          link: '/build/getting-started',
        },
        {
          text: 'Configuration',
        },
        {
          text: 'Rollup Operations',
        },
        {
          text: 'Explorer and Indexer',
        },
        {
          text: 'Using the OP Stack Client SDK',
        },
        {
          text: 'OP Stack Hacks',
        },
      ],
    },
    {
      text: 'Contributing',
      items: [
        {
          text: 'Contribute to the OP Stack',
        },
      ],
    },
  ],
  topNav: [
    {
      text: 'Home',
      link: 'https://optimism.io',
    },
    {
      text: 'OP Stack Docs',
      link: '/',
    },
    {
      text: 'Optimism Docs',
      link: 'https://docs.optimism.io',
    },
    {
      text: 'Governance',
      link: 'https://discord.com',
    },
  ],
  socials: [
    { icon: 'discord', link: '' },
    { icon: 'github', link: '' },
    { icon: 'x', link: '' },
  ],
  theme: {
    accentColor: {
      light: 'red',
      dark: '#ff6868',
    },
  },
  title: 'OP Stack Docs',
})
