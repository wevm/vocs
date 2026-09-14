import ruby from 'shiki/langs/ruby.mjs'
import { defineConfig } from 'vocs/config'

export default defineConfig({
  title: 'Performance fixture',
  // A real, large grammar must remain available to the build, but not the browser config.
  codeHighlight: {
    langs: [
      ...ruby,
      {
        name: 'performance-only',
        scopeName: 'source.vocs-performance-server-only',
        repository: {},
        patterns: [{ match: 'SERVER_ONLY_TOKEN', name: 'keyword.control' }],
      },
    ],
    langAlias: { rb: 'ruby' },
  },
  sidebar: [
    { text: 'Overview', link: '/' },
    { text: 'Second page', link: '/second' },
  ],
  head: (path) => ({ title: path === '/' ? 'Overview fixture' : 'Second fixture' }),
})
