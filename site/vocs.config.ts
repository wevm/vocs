import { Changelog, defineConfig, Feedback, McpSource, Twoslash } from 'vocs/config'
import { version } from '../package.json'

export default defineConfig({
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? 'https://vocs.dev'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://vocs.dev',
  changelog: Changelog.github({ repo: 'wevm/vocs' }),
  checkDeadlinks: true,
  feedback: Feedback.slack(),
  description: 'Vocs is a library for creating documentation websites.',
  editLink: {
    link: 'https://github.com/wevm/vocs/edit/rc/site/src/pages/:path',
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
  ogImageUrl: (path, { baseUrl }) => {
    if (path === '/') {
      const homeOgDescription =
        'Publish docs that stay simple at the source and rich in the browser.'
      const homeOgTitle = 'Minimal Docs\nfor Agents & Humans.'

      return `${baseUrl ?? ''}/api/og?logo=%logo&title=${encodeURIComponent(homeOgTitle)}&description=${encodeURIComponent(homeOgDescription)}`
    }

    return `${baseUrl ?? ''}/api/og?logo=%logo&title=%title&description=%description`
  },
  redirects: [
    // Legacy /docs/* → new locations
    { source: '/docs', destination: '/introduction/getting-started' },
    { source: '/docs/structure', destination: '/introduction/project-structure' },
    { source: '/docs/markdown', destination: '/writing/markdown-extensions' },
    { source: '/docs/guides/code-snippets', destination: '/writing/code-snippets' },
    { source: '/docs/guides/layouts', destination: '/features/layouts' },
    { source: '/docs/guides/markdown-snippets', destination: '/writing/markdown-snippets' },
    { source: '/docs/guides/navigation', destination: '/features/navigation' },
    { source: '/docs/guides/og-images', destination: '/features/dynamic-og-images' },
    { source: '/docs/guides/styling', destination: '/features/theming' },
    { source: '/docs/guides/theming', destination: '/features/theming' },
    { source: '/docs/guides/twoslash', destination: '/writing/twoslash' },
    { source: '/docs/api/config', destination: '/reference/site-config' },
    { source: '/docs/api/frontmatter', destination: '/writing/frontmatter' },

    // /guide/* → /introduction/*
    { source: '/guide/what-is-vocs', destination: '/introduction/what-is-vocs' },
    { source: '/guide/getting-started', destination: '/introduction/getting-started' },
    { source: '/guide/structure', destination: '/introduction/project-structure' },
    { source: '/guide/writing-docs-with-ai', destination: '/introduction/writing-docs-with-ai' },

    // /guide/* → /writing/*
    { source: '/guide/markdown-extensions', destination: '/writing/markdown-extensions' },
    { source: '/guide/syntax-highlighting', destination: '/writing/syntax-highlighting' },
    { source: '/guide/twoslash', destination: '/writing/twoslash' },
    { source: '/guide/code-snippets', destination: '/writing/code-snippets' },
    { source: '/guide/markdown-snippets', destination: '/writing/markdown-snippets' },
    { source: '/guide/react', destination: '/writing/react' },
    { source: '/guide/asset-handling', destination: '/writing/assets' },
    { source: '/guide/frontmatter', destination: '/writing/frontmatter' },

    // /guide/* → /features/*
    { source: '/guide/navigation', destination: '/features/navigation' },
    { source: '/guide/layouts', destination: '/features/layouts' },
    { source: '/guide/theming', destination: '/features/theming' },
    { source: '/guide/tailwind', destination: '/features/tailwind' },
    { source: '/guide/dynamic-og-images', destination: '/features/dynamic-og-images' },
    { source: '/guide/feedback', destination: '/features/feedback' },
    { source: '/guide/mcp-server', destination: '/features/mcp-server' },
    { source: '/guide/changelog-generation', destination: '/features/changelog-generation' },
    { source: '/guide/ai-support', destination: '/features/agent-support' },
    { source: '/features/llms-txt', destination: '/features/agent-support' },
    { source: '/features/mdx-wrapper', destination: '/features/layouts' },
    { source: '/features/deployment', destination: '/deployment/vercel' },

    // Changelog
    { source: '/guide/changelog', destination: '/changelog' },
  ],
  sidebar: [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'What is Vocs?', link: '/introduction/what-is-vocs' },
        { text: 'Getting Started', link: '/introduction/getting-started' },
        { text: 'Project Structure', link: '/introduction/project-structure' },
        { text: 'Writing Docs with AI', link: '/introduction/writing-docs-with-ai' },
      ],
    },
    {
      text: 'Writing',
      collapsed: false,
      items: [
        { text: 'Markdown Extensions', link: '/writing/markdown-extensions' },
        { text: 'Code & Syntax Highlighting', link: '/writing/syntax-highlighting' },
        { text: 'Twoslash', link: '/writing/twoslash' },
        { text: 'Code Snippets', link: '/writing/code-snippets' },
        { text: 'Markdown Snippets', link: '/writing/markdown-snippets' },
        { text: 'React in Markdown', link: '/writing/react' },
        { text: 'Mermaid Diagrams', link: '/writing/mermaid' },
        { text: 'Assets', link: '/writing/assets' },
        { text: 'Frontmatter', link: '/writing/frontmatter' },
      ],
    },
    {
      text: 'Customization',
      collapsed: false,
      items: [
        { text: 'Agent Support', link: '/features/agent-support' },
        { text: 'API Routes', link: '/features/api-routes' },
        { text: 'Ask AI', link: '/features/ask-ai' },
        { text: 'Changelog Generation', link: '/features/changelog-generation' },
        { text: 'Dynamic OG Images', link: '/features/dynamic-og-images' },
        { text: 'Head Tags', link: '/features/head' },
        { text: 'Layouts', link: '/features/layouts' },
        { text: 'MCP Server', link: '/features/mcp-server' },
        { text: 'Navigation', link: '/features/navigation' },
        { text: 'Page Feedback', link: '/features/feedback' },
        { text: 'Redirects', link: '/features/redirects' },
        { text: 'Rehype & Remark', link: '/features/rehype-and-remark' },
        { text: 'Search', link: '/features/search' },
        { text: 'Slots', link: '/features/slots' },
        { text: 'SSG or SSR', link: '/features/render-strategies' },
        { text: 'Tailwind CSS', link: '/features/tailwind' },
        { text: 'Theming', link: '/features/theming' },
        { text: 'Vite', link: '/features/vite' },
      ],
    },
    {
      text: 'Deployment',
      collapsed: false,
      items: [
        { text: 'Vercel', link: '/deployment/vercel' },
        { text: 'Netlify', link: '/deployment/netlify' },
        { text: 'Node.js', link: '/deployment/node' },
      ],
    },
    {
      text: 'API Reference',
      collapsed: false,
      items: [
        { text: 'Site Configuration', link: '/reference/site-config' },
        { text: 'Frontmatter', link: '/reference/frontmatter' },
        { text: 'Components', link: '/reference/components' },
        { text: 'Hooks', link: '/reference/hooks' },
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
      text: 'Guides & API',
      link: '/introduction/getting-started',
      match: (path) =>
        Boolean(
          path?.startsWith('/introduction') ||
            path?.startsWith('/writing') ||
            path?.startsWith('/features') ||
            path?.startsWith('/reference'),
        ),
    },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Changelog',
          link: '/changelog',
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
