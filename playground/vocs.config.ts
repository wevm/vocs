import { defineConfig } from 'vocs/config'

export default defineConfig({
  checkDeadlinks: false,
  description: 'Vocs is a library for creating documentation websites.',
  iconUrl: {
    light: '/icon-light.svg',
    dark: '/icon-dark.svg',
  },
  title: 'Vocs – React Documentation Framework',
  titleTemplate: '%s – Vocs',
})
