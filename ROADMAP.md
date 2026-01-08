# Vocs v2 Roadmap

A comprehensive checklist of features for Vocs v2, based on Vocs v1 feature parity, competitive analysis (Mintlify, Fumadocs, Nextra, Docusaurus), and team feature requests.

---

## Core Infrastructure

- [x] Vite plugin architecture
- [x] Waku integration for SSR/SSG
- [x] MDX processing
- [x] Virtual modules (`virtual:vocs/config`, `virtual:vocs/user-styles`)
- [x] Hot module reloading for config
- [ ] Sitemap generation
- [ ] Blog
- [x] Redirects
- [ ] PWA support
- [ ] RSS generation

## Layout & Navigation

- [x] Layout component (base)
- [x] Sidebar component
- [x] Sidebar parsing from config
- [x] Top navigation component
- [x] Top navigation parsing from config
- [x] Logo (text/image/light-dark)
- [x] Page outline
- [x] Footer
- [ ] Banner (dismissable, customizable colors)
- [x] Skip link for accessibility
- [x] Pagination (prev/next page links)
- [ ] Back to top button
- [x] Mobile navigation menus
- [x] 404 page
- [x] Error boundaries

## Search

- [x] Search trigger component
- [ ] Search dialog implementation
- [ ] "Jump to" suggestions
- [ ] Hybrid local/AI search
  - [ ] Minisearch (Local)
  - [ ] RAG (AI)
  - [ ] Optimistic keyword search (local), then hydrate with semantic suggestions (AI)
- [ ] Keyboard navigation
- [ ] Recently viewed pages

## Code Blocks

- [x] Shiki syntax highlighting with themes
- [x] Twoslash support with file-based caching
- [x] CodeBlock component
- [x] CodeGroup component (tabbed code blocks)
- [x] Code block title/filename
- [x] Diff highlighting (`// [!code ++]`, `// [!code --]`)
- [x] Line highlighting (`// [!code highlight]`)
- [x] Line focusing (`// [!code focus]`)
- [x] Line numbers toggle (`// [!code line-numbers]`)
- [x] Empty line handling
- [ ] Copy button for code blocks
- [ ] Expandable code blocks/code wrapping
- [x] Inline code highlighting
- [x] `// @includes` support (virtual + physical files)
- [ ] `// @log` support outside Twoslash
- [ ] Terminal/bash decorations (non-copyable `$` prefix)
- [ ] REPL

## MDX Components & Directives

- [x] Callout/Aside (note, info, warning, danger, tip, success)
- [x] Steps
- [x] CodeGroup
- [x] Details/Accordion
- [ ] Tabs
- [ ] Authors
- [ ] BlogPosts
- [ ] Button
- [ ] Raw (escape MDX processing)
- [ ] Cards
- [ ] Sponsors
- [ ] Tiles (grid of links)
- [ ] Files/FileTree
- [ ] TypeTable
- [ ] Badge
- [ ] Tooltip
- [ ] Image zoom
- [ ] Mermaid diagram

## Remark/Rehype Plugins

### Remark (Markdown AST)

- [x] `remarkFrontmatter` – YAML frontmatter parsing
- [x] `remarkMdxFrontmatter` – Exports frontmatter as MDX variable
- [x] `remarkDefaultFrontmatter` – Auto-generates title/description from h1
- [x] `remarkMetaFrontmatter` – Adds lastModified timestamp
- [x] `remarkSubheading` – Extracts `# Title [description]` into hgroup
- [x] `remarkGfm` – GitHub Flavored Markdown (tables, strikethrough, etc.)
- [x] `remarkDirective` – Container/leaf/text directives support
- [x] `remarkCallout` – Callout/aside directives (info, warning, danger, tip, success, note)
- [x] `remarkCodeGroup` – Code group directive for tabbed code blocks
- [x] `remarkCodeTitle` – Normalizes code block titles
- [x] `remarkDetails` – Details/accordion directive
- [x] `remarkSteps` – Steps directive for step-by-step guides
- [x] `remarkSandbox` – Transforms code blocks with `sandbox` meta into interactive Sandbox components
- [x] `remarkVocsScope` – Adds `data-v` attribute for scoped styling

### Rehype (HTML AST)

- [x] `rehypeSlug` – Adds IDs to headings
- [x] `rehypeAutolinkHeadings` – Wraps headings with anchor links
- [x] `rehypeShiki` – Shiki syntax highlighting with Twoslash support
- [x] `rehypeCodeInLink` – Inverts `<a><code>` to `<code><a>` for better styling
- [x] `rehypeLinks` – Strips .md/.mdx extensions, validates internal links (dead link checking)

### Recma (ESTree/JS AST)

- [x] `recmaMdxLayout` – Wraps MDX with layout component, injects frontmatter context

## Configuration

- [x] `accentColor`
- [x] `basePath`
- [x] `baseUrl`
- [x] `cacheDir`
- [x] `checkDeadlinks`
- [x] `codeHighlight` (langs, themes)
- [x] `colorScheme`
- [x] `description`
- [x] `iconUrl`
- [x] `logoUrl`
- [x] `markdown` (custom remark/rehype plugins)
- [x] `ogImageUrl`
- [x] `renderStrategy`
- [x] `sidebar`
- [x] `title`
- [x] `titleTemplate`
- [x] `topNav`
- [x] `twoslash`
- [ ] `banner`
- [ ] `blogDir`
- [x] `editLink`
- [ ] `search`
- [ ] `socials` (GitHub, Discord, X, Bluesky, etc.)
- [ ] `sponsors`

## SEO & Meta

- [x] Title and description meta tags
- [x] Canonical URL
- [x] Open Graph tags (type, title, site_name, url, description, image)
- [x] Twitter card tags (card, title, description, image)
- [x] Author meta tag
- [x] Robots meta tag
- [x] Article metadata (author, modified_time)
- [x] Dynamic OG image URL with template variables (%logo, %title, %description)
- [x] Icon/favicon support (with light/dark variants)
- [ ] Dynamic OG image API
- [ ] OG image templates
- [ ] Per-page OG image customization
- [ ] Custom fonts/colors in OG images

## AI & LLM Features

- [x] llms.txt generation
- [x] llms-full.txt generation
- [x] Per-page markdown (/assets/md/*.md)
- [x] Ask AI component
- [ ] Inline AI assistant
- [ ] "Is this page useful?" feedback widget

## Styling & Theming

- [x] Tailwind CSS integration
- [x] CSS variables theming system
- [x] Accent color with light-dark support
- [x] Shiki/code block styling
- [x] Twoslash hover popovers
- [x] Typography system (heading sizes, line heights)
- [x] Responsive breakpoints
- [x] User styles support (`_root.css`)
- [x] Dark/light theme toggle UI
- [x] Color scheme toggle (system/light/dark)

## CLI

- [ ] `create-vocs`

## Miscellaneous

- [ ] Versioning
- [ ] Automated changelogs
- [ ] Internationalization/i18n
- [ ] OpenAPI
- [ ] OpenRPC
- [ ] Analytics integration
- [ ] MDX remote/dynamic content
- [ ] PDF export
