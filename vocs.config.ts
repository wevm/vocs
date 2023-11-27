import { defineConfig } from './src/index.js'

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
      title: 'Overview',
      link: '/',
    },
    {
      title: 'Kitchen Sink',
      link: '/kitchen-sink',
    },
    {
      title: 'API',
      items: [
        {
          title: 'defineConfig',
          link: '/api/defineConfig',
        },
      ],
    },
  ],
  title: 'Vocs',
  topNav: [
    { title: 'Guide & API', link: '/' },
    { title: 'Blog', link: '/blog' },
  ],
})
