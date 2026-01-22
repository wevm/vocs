import { Changelog, defineConfig, Feedback, McpSource, Twoslash } from 'vocs/config'
import { version } from '../package.json'

export default defineConfig({
  banner: 'Vocs v2 is now available!',
  changelog: Changelog.github({ repo: 'wevm/vocs' }),
  checkDeadlinks: true,
  feedback: Feedback.slack(),
  description: 'Vocs is a library for creating documentation websites.',
  editLink: {
    link: 'https://github.com/wevm/vocs/edit/main/site/src/pages/:path',
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
  redirects: [],
  sidebar: {
    '/': [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Vocs? 🚧', link: '/guide/what-is-vocs' },
          { text: 'Getting Started 🚧', link: '/guide/getting-started' },
          { text: 'Project Structure 🚧', link: '/guide/project-structure' },
          { text: 'Deploy 🚧', link: '/guide/deploy' },
        ],
      },
      {
        text: 'Writing',
        items: [
          { text: 'Markdown Extensions', link: '/guide/markdown-extensions' },
          { text: 'Code & Syntax Highlighting', link: '/guide/syntax-highlighting' },
          { text: 'Asset Handling 🚧', link: '/guide/asset-handling' },
          { text: 'Frontmatter 🚧', link: '/guide/frontmatter' },
          { text: 'Using React in Markdown 🚧', link: '/guide/react' },
          { text: 'Twoslash', link: '/guide/twoslash' },
        ],
      },
      {
        text: 'Customization',
        items: [
          { text: 'Sidebar & Top Navigation 🚧', link: '/guide/navigation' },
          { text: 'Theming 🚧', link: '/guide/theming' },
          { text: 'Layouts 🚧', link: '/guide/layouts' },
          { text: 'Dynamic OG Images 🚧', link: '/guide/dynamic-og-images' },
          { text: 'MCP Server 🚧', link: '/guide/mcp-server' },
          { text: 'Feedback', link: '/guide/feedback' },
          { text: 'Changelog Generation 🚧', link: '/guide/changelog-generation' },
        ],
      },
      { text: 'Config & API Reference', link: '/reference/site-config' },
      { text: 'Changelog', link: '/guide/changelog' },
    ],
    '/reference/': {
      items: [
        {
          text: 'Reference',
          items: [
            { text: 'Site Config 🚧', link: '/reference/site-config' },
            { text: 'Frontmatter Config 🚧', link: '/reference/frontmatter-config' },
            { text: 'CLI 🚧', link: '/reference/cli' },
            {
              text: 'Components',
              items: [
                { text: 'Badge 🚧', link: '/reference/Badge' },
                { text: 'Card 🚧', link: '/reference/Card' },
                { text: 'Cards 🚧', link: '/reference/Cards' },
                { text: 'HomePage 🚧', link: '/reference/HomePage' },
                { text: 'Link 🚧', link: '/reference/Link' },
                { text: 'Sandbox 🚧', link: '/reference/Sandbox' },
                { text: 'Tab 🚧', link: '/reference/Tab' },
                { text: 'Tabs 🚧', link: '/reference/Tabs' },
              ],
            },
            {
              text: 'Hooks',
              items: [
                { text: 'useConfig 🚧', link: '/reference/useConfig' },
                { text: 'useRouter 🚧', link: '/reference/useRouter' },
              ],
            },
          ],
        },
      ],
    },
  },
  socials: [
    { icon: 'github', link: 'https://github.com/wevm/vocs' },
    { icon: 'x', link: 'https://twitter.com/wevm_dev' },
    { icon: 'discord', link: 'https://discord.gg/JUrRkGweXV' },
  ],
  title: 'Vocs',
  titleTemplate: '%s – Vocs',
  topNav: [
    { text: 'Guide', link: '/guide/what-is-vocs', match: '/guide' },
    { text: 'Reference', link: '/reference/site-config', match: '/reference' },
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
