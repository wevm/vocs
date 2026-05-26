import { Changelog, defineConfig, Feedback, McpSource, Twoslash } from 'vocs/config'
import { version } from '../package.json'

export default defineConfig({
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? 'https://next.vocs.dev'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://next.vocs.dev',
  changelog: Changelog.github({ repo: 'wevm/vocs' }),
  checkDeadlinks: true,
  feedback: Feedback.slack(),
  description: 'Vocs is a library for creating documentation websites.',
  editLink: {
    link: 'https://github.com/wevm/vocs/edit/next/site/src/pages/:path',
  },
  iconUrl: {
    light: '/icon-light.svg',
    dark: '/icon-dark.svg',
  },
  logoUrl: {
    light: '/logo-tight-light.svg',
    dark: '/logo-tight-dark.svg',
  },
  mcp: {
    enabled: true,
    sources: [McpSource.github({ repo: 'wevm/vocs' })],
  },
  ogImageUrl: (_path, { baseUrl }) => {
    return `${baseUrl ?? ''}/api/og?logo=%logo&title=%title&description=%description`
  },
  redirects: [
    { source: '/changelog', destination: '/guide/changelog' },
    { source: '/docs', destination: '/guide/getting-started' },
    { source: '/docs/structure', destination: '/guide/structure' },
    { source: '/docs/markdown', destination: '/guide/markdown-extensions' },
    { source: '/docs/guides/code-snippets', destination: '/guide/code-snippets' },
    { source: '/docs/guides/layouts', destination: '/guide/layouts' },
    { source: '/docs/guides/markdown-snippets', destination: '/guide/markdown-snippets' },
    { source: '/docs/guides/navigation', destination: '/guide/navigation' },
    { source: '/docs/guides/og-images', destination: '/guide/dynamic-og-images' },
    { source: '/docs/guides/styling', destination: '/guide/theming' },
    { source: '/docs/guides/theming', destination: '/guide/theming' },
    { source: '/docs/guides/twoslash', destination: '/guide/twoslash' },
    { source: '/docs/api/config', destination: '/reference/site-config' },
    { source: '/docs/api/frontmatter', destination: '/guide/frontmatter' },
  ],
  sidebar: [
    { text: 'What is Vocs?', link: '/guide/what-is-vocs' },
    { text: 'Getting Started', link: '/guide/getting-started' },
    { text: 'Writing Docs with AI', link: '/guide/writing-docs-with-ai' },
    { text: 'Project Structure', link: '/guide/structure' },
    {
      text: 'Writing',
      collapsed: false,
      items: [
        { text: 'Markdown Extensions', link: '/guide/markdown-extensions' },
        { text: 'Code & Syntax Highlighting', link: '/guide/syntax-highlighting' },
        { text: 'Code Snippets', link: '/guide/code-snippets' },
        { text: 'Markdown Snippets', link: '/guide/markdown-snippets' },
        { text: 'Asset Handling', link: '/guide/asset-handling' },
        { text: 'Frontmatter', link: '/guide/frontmatter' },
        { text: 'Using React in Markdown', link: '/guide/react' },
        { text: 'Twoslash', link: '/guide/twoslash' },
      ],
    },
    {
      text: 'Customization',
      collapsed: false,
      items: [
        { text: 'Sidebar & Top Navigation', link: '/guide/navigation' },
        { text: 'Theming', link: '/guide/theming' },
        { text: 'Tailwind CSS', link: '/guide/tailwind' },
        { text: 'Layouts', link: '/guide/layouts' },
        { text: 'Dynamic OG Images', link: '/guide/dynamic-og-images' },
        { text: 'Feedback', link: '/guide/feedback' },
        { text: 'Changelog Generation', link: '/guide/changelog-generation' },
        { text: 'MCP Server', link: '/guide/mcp-server' },
        { text: 'AI Support', link: '/guide/ai-support' },
      ],
    },
    {
      text: 'API',
      collapsed: false,
      items: [
        { text: 'Site Config', link: '/reference/site-config' },
        { text: 'Components', link: '/reference/components' },
        { text: 'Hooks', link: '/reference/hooks' },
        { text: 'Changelog', link: '/guide/changelog' },
      ],
    },
  ],
  socials: [
    { icon: 'github', link: 'https://github.com/wevm/vocs' },
    { icon: 'x', link: 'https://twitter.com/wevm_dev' },
    { icon: 'discord', link: 'https://discord.gg/JUrRkGweXV' },
  ],
  title: 'Vocs',
  titleTemplate: '%s – Vocs',
  topNav: [
    {
      text: 'Guide & API',
      link: '/guide/getting-started',
      match: (path) => Boolean(path?.startsWith('/guide') || path?.startsWith('/reference')),
    },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Changelog',
          link: '/guide/changelog',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/wevm/vocs/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
  twoslash: {
    transformers: [Twoslash.experimental_rust({ cargoToml: './Cargo.toml', cacheOnly: true })],
  },
})
