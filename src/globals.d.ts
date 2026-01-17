/// <reference types="unplugin-icons/types/react" />

declare module '*.mdx' {
  export const frontmatter: import('./config.js').Frontmatter
  export function Page(props: Record<string, unknown>): JSX.Element
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
}

declare module '*.md' {
  export const frontmatter: import('./config.js').Frontmatter
  export function Page(props: Record<string, unknown>): JSX.Element
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
}

declare module 'virtual:vocs/config' {
  export const config: import('./config.js').Config
}

declare module 'virtual:vocs/langs' {
  export const langs: import('shiki').LanguageRegistration[]
}

declare module 'virtual:vocs/search-index' {
  export function getSearchIndex(): Promise<string>
}

declare module 'virtual:vocs/group-icons.css' {}

declare module 'virtual:vocs/group-icons.css?inline' {
  const css: string
  export default css
}

declare module 'virtual:vocs/user-styles' {
  const url: string | undefined
  export default url
}

declare module 'virtual:vocs/user-styles?inline' {
  const css: string | undefined
  export default css
}
