import { defineConfig } from '../../src/index.js'
import react from '@vitejs/plugin-react'

export default defineConfig({
  sidebar: [
    {
      text: 'Getting Started',
      link: '/',
    },
    {
      text: 'Migration Guide',
      link: '/migration-guide',
    },
  ],
  title: 'Viem',
  vite: {
    plugins: [
      // You can customize Vite plugins such as the React plugin here.
      react(),
    ],
  },
})
