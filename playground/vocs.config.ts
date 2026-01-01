import { defineConfig } from 'vocs/config'

export default defineConfig({
  checkDeadlinks: false,
  description: 'Vocs is a library for creating documentation websites.',
  logoUrl: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  },
  iconUrl: {
    light: '/icon-light.svg',
    dark: '/icon-dark.svg',
  },
  title: 'Vocs',
  titleTemplate: '%s – Vocs',
})
