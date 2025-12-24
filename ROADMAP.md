# Vocs v2 Roadmap

A comprehensive checklist of features for Vocs v2, based on Vocs v1 feature parity, competitive analysis (Mintlify, fumadocs, nextra, Docusaurus), and team feature requests.

---

## Core

- [x] Waku integration for SSR / SSG
- [x] MDX processing
- [ ] Sitemap generation
- [ ] Redirects
- [ ] PWA support
- [ ] RSS generation

## Layout & Navigation

- [ ] Layouts
  - [ ] Home
  - [ ] Docs (+ sidebar & outline)
  - [ ] Blog 
  - [ ] Minimal
- [ ] Sidebar
- [ ] Top Navigation
- [ ] Page Outline
- [ ] Footer
- [ ] Banner (dismissable, customizable colors)
- [ ] Skip link for accessibility
- [ ] Breadcrumb navigation
- [ ] Pagination (prev/next page links)
- [ ] Back to top button
- [ ] Zen mode

## Search

- [ ] Search dialog
- [ ] Keyboard navigation
- [ ] Recently viewed pages w/ Cmd+K

## Code Blocks

- [x] Shiki syntax highlighting with themes
- [x] Twoslash support with file-based caching
- [ ] Line highlighting (`// [!code highlight]`)
- [ ] Line focusing (`// [!code focus]`, range support)
- [ ] Line numbers toggle
- [ ] Code block title/filename
- [ ] Copy button for code blocks
- [ ] Diff highlighting (`// [!code ++]`, `// [!code --]`)
- [ ] Expandable code blocks/code wrapping (click to expand)
- [ ] Inline code highlighting
- [ ] `// @includes` support outside twoslash (both virtual + physical files)
- [ ] `// @log` support outside twoslash
- [ ] Terminal/bash decorations (non-copyable `$` prefix)
- [ ] REPL

## MDX Components & Directives

- [ ] Callout/Aside (note, info, warning, danger, tip, success)
- [ ] Tabs
- [ ] Steps
- [ ] CodeGroup (tabbed code blocks)
- [ ] Accordion/Details
- [ ] Authors
- [ ] BlogPosts
- [ ] Button
- [ ] Callout
- [ ] CodeGroup
- [ ] Raw (escape MDX processing)
- [ ] Cards
- [ ] Details
- [ ] Sponsors
- [ ] Tiles (grid of links)
- [ ] Files/FileTree
- [ ] TypeTable
- [ ] Badge
- [ ] Steps
- [ ] Tooltip
- [ ] Image zoom
- [ ] Mermaid diagram

## Remark/Rehype Plugins

- [x] Frontmatter
- [ ] Subheading extraction (`# Title [description]`)
- [ ] Dead link checking

## Configuration

- [ ] `sidebar`
- [ ] `topNav`
- [ ] `socials` (GitHub, Discord, X, Bluesky, etc.)
- [ ] `editLink`
- [ ] `font` (Google Fonts)
- [ ] `theme`/`accentColor`
- [ ] CSS variables theming system
- [ ] `banner`
- [ ] `sponsors`
- [ ] `search`
- [ ] `checkDeadlinks`
- [ ] `blogDir`
- [ ] `cacheDir`
- [ ] `head` (custom meta tags per page)
- [ ] `outlineFooter`

## SEO & Meta

- [ ] Pluggable global/per-page meta configuration 
- [ ] Open Graph tags
- [ ] Twitter card tags
- [ ] More customizable OG image templates
- [ ] Per-page OG image customization
- [ ] Custom fonts/colors in OG images

## AI & LLM Features

- [x] llms.txt generation
- [x] llms-full.txt generation
- [ ] AI CTA dropdown (Open in ChatGPT, Claude, etc.)
- [ ] MCP (Model Context Protocol) server endpoint (`/mcp`)
- [ ] Inline AI assistant
- [ ] "Is this page useful?" feedback widget with freeform questions
- [ ] Admin dashboard for viewing user questions
- [ ] Contextual AI menu

## Styling & Theming

- [ ] CSS system (tailwind, css variables, etc.)
- [ ] Shiki/code blocks
- [ ] Twoslash popovers
- [ ] Dark/light theme toggle
- [ ] Color scheme support (system/light/dark)
- [ ] Typography

## CLI

- [ ] `create-vocs`

## Icons

- [ ] Social icons (GitHub, Discord, X, Bluesky, Farcaster, Telegram, Warpcast)
- [ ] UI icons (arrows, chevrons, copy, menu, sun/moon, etc.)
- [ ] Icon component wrapper

## Misc. Features

- [ ] Versioning
- [ ] Automated changelogs
- [ ] Internationalization/i18n
- [ ] API playground/OpenAPI support
- [ ] Analytics integration
- [ ] MDX remote/dynamic content
- [ ] PDF export

