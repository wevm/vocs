import { defineConfig } from '../../src/index.js'

export default defineConfig({
  sidebar: [
    {
      text: 'Overview',
      link: '/',
    },
    {
      text: 'Subpage',
      link: '/subpage',
    },
  ],
  title: 'Custom Layout',
  topNav: [
    {
      text: 'Overview',
      link: '/',
    },
    {
      text: 'Subpage',
      link: '/subpage',
    },
  ],
})
