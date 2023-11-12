import { defineConfig } from '../../src/index.js'

export default defineConfig({
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
      title: 'Overview',
      path: '/',
    },
    {
      title: 'Kitchen Sink',
      path: '/kitchen-sink',
    },
  ],
  title: 'Vocs',
})
