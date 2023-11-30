import { defineConfig } from '../../src/index.js'

export default defineConfig({
  sidebar: {
    '/': [
      {
        text: 'Uniswap Overview',
        link: '/',
      },
      {
        text: 'The Uniswap Protocol',
        link: '/uniswap-protocol',
      },
      {
        text: 'Protocol Concepts',
        collapsed: false,
        items: [
          {
            text: 'Concentrated Liquidity',
            link: '/protocol/concentrated-liquidity',
          },
          {
            text: 'Fees',
          },
          {
            text: 'Oracle',
          },
          {
            text: 'Range Orders',
          },
          {
            text: 'Swaps',
          },
          {
            text: 'Token Integration Issues',
          },
        ],
      },
      {
        text: 'Governance',
        collapsed: false,
        items: [
          {
            text: 'Overview',
          },
          {
            text: 'Process',
          },
          {
            text: 'Beginners Guide to Voting',
          },
          {
            text: 'Glossary',
          },
          {
            text: 'Adverserial Circumstances',
          },
          {
            text: 'Changelog',
          },
        ],
      },
      {
        text: 'Research',
      },
      {
        text: 'Resources',
      },
      {
        text: 'Glossary',
      },
    ],
  },
  topNav: [
    {
      text: 'Concepts',
      link: '/',
    },
    {
      text: 'Contracts',
      link: '/contracts',
    },
    {
      text: 'SDKs',
      link: '/sdks',
    },
    {
      text: 'APIs',
      link: '/apis',
    },
    {
      text: 'More',
      children: [
        {
          text: 'Give Feedback',
          link: '/feedback',
        },
        {
          text: 'Whitepaper',
          link: '/feedback',
        },
        {
          text: 'Grants',
          link: 'https://unigrants.org/',
        },
      ],
    },
  ],
  title: 'Uniswap Docs',
})
