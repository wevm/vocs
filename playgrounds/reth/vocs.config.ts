import { defineConfig } from '../../src/index.js'

export default defineConfig({
  sidebar: [
    {
      text: 'Introduction',
      link: '/',
    },
    {
      text: 'Installation',
      items: [
        {
          text: 'Pre-Built Binaries',
          link: '/installation/binaries',
        },
        {
          text: 'Docker',
          link: '/installation/docker',
        },
        {
          text: 'Build from Source',
          link: '/installation/source',
        },
        {
          text: 'Build for ARM Devices',
          link: '/installation/build-for-arm-devices',
        },
        {
          text: 'Update Priorities',
          link: '/installation/priorities',
        },
      ],
    },
    {
      text: 'Run a Node',
      items: [
        {
          text: 'Mainnet or Official Testnets',
          link: '/run/mainnet',
        },
        {
          text: 'OP Stack',
          link: '/run/optimism',
        },
        {
          text: 'Private Testnet',
          link: '/run/private-testnet',
        },
        {
          text: 'Metrics',
          link: '/run/observability',
        },
        {
          text: 'Configuring Reth',
          link: '/run/config',
        },
        {
          text: 'Transaction Types',
          link: '/run/transactions',
        },
        {
          text: 'Pruning & Full Node',
          link: '/run/pruning',
        },
        {
          text: 'Ports',
          link: '/run/ports',
        },
        {
          text: 'Troubleshooting',
          link: '/run/troubleshooting',
        },
      ],
    },
    {
      text: 'Interacting over JSON-RPC',
      link: '/jsonrpc/intro',
      items: [
        {
          text: 'eth',
          link: '/jsonrpc/eth',
        },
        {
          text: 'web3',
          link: '/jsonrpc/web3',
        },
        {
          text: 'net',
          link: '/jsonrpc/net',
        },
        {
          text: 'txpool',
          link: '/jsonrpc/txpool',
        },
        {
          text: 'debug',
          link: '/jsonrpc/debug',
        },
        {
          text: 'trace',
          link: '/jsonrpc/trace',
        },
        {
          text: 'admin',
          link: '/jsonrpc/admin',
        },
        {
          text: 'rpc',
          link: '/jsonrpc/rpc',
        },
      ],
    },
    {
      text: 'CLI Reference',
      items: [
        {
          text: 'reth node',
          link: '/cli/node',
        },
        {
          text: 'reth init',
          link: '/cli/init',
        },
        {
          text: 'reth import',
          link: '/cli/import',
        },
        {
          text: 'reth db',
          link: '/cli/db',
        },
        {
          text: 'reth stage',
          link: '/cli/stage',
        },
        {
          text: 'reth p2p',
          link: '/cli/p2p',
        },
        {
          text: 'reth test-vectors',
          link: '/cli/test-vectors',
        },
        {
          text: 'reth config',
          link: '/cli/config',
        },
        {
          text: 'reth debug',
          link: '/cli/debug',
        },
        {
          text: 'reth recover',
          link: '/cli/recover',
        },
      ],
    },
  ],
  topNav: [
    {
      text: 'Contribute',
      link: '/developers/contribute',
    },
  ],
  editLink: {
    pattern: 'https://github.com/paradigmxyz/reth/blob/main/book/:path',
    text: 'Edit this page on GitHub',
  },
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/paradigmxyz/reth',
    },
  ],
  title: 'Reth Book',
})
