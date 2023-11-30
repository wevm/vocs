import { defineConfig } from '../../src/index.js'

export default defineConfig({
  logoUrl: '/privy-logo-full.png',
  sidebar: [
    {
      text: 'Introduction',
      link: '/',
    },
    {
      text: 'Setup',
      collapsed: false,
      items: [
        { text: 'Quickstart', link: '/guide/quickstart' },
        { text: 'Customizing Privy' },
        { text: 'Configuring Networks' },
        { text: 'Configuring Allowed Domains' },
        { text: 'Configuring SSR' },
      ],
    },
    {
      text: 'Authentication',
      collapsed: false,
      items: [
        { text: 'Logging Users In' },
        { text: 'Getting Authentication Status' },
        { text: 'Logging Users Out' },
      ],
    },
    {
      text: 'Users',
      collapsed: false,
      items: [
        { text: 'Handling the User Object' },
        { text: 'Linking Additional Accounts' },
        { text: 'Unlinking Accounts' },
      ],
    },
    {
      text: 'Wallets',
      collapsed: false,
      items: [
        { text: 'Overview' },
        { text: 'Interfacing with External Wallets' },
        { text: 'Handling Multiple Wallets' },
        { text: 'Networks' },
        { text: 'Funding Wallets' },
      ],
    },
  ],
  topNav: [
    {
      text: 'Guide',
      link: '/',
    },
    {
      text: 'Reference',
      link: '/reference',
    },
    {
      text: 'Support',
      link: 'https://discord.com',
    },
    {
      text: 'Console',
      link: 'https://discord.com',
    },
  ],
  socials: [{ icon: 'github', link: '' }],
  title: 'Privy',
})
