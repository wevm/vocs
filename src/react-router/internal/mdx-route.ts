import type { MetaDescriptor } from 'react-router'
import type { Config } from '../../config.js'
import type { Frontmatter } from '../../types.js'

export function meta(options: meta.Options): MetaDescriptor[] {
  const { config, editUrl, frontmatter, lastModified } = options

  const title = frontmatter?.title ?? config.title
  const titleTemplate = title.includes(config.title) ? undefined : config.titleTemplate
  const fullTitle = titleTemplate ? titleTemplate.replace('%s', title) : title

  return [
    { title: fullTitle },
    { name: 'description', content: frontmatter?.description ?? '' },
    ...(editUrl ? [{ name: 'edit-url', content: editUrl }] : []),
    ...(lastModified ? [{ name: 'last-modified', content: lastModified }] : []),
  ]
}

declare namespace meta {
  export type Options = {
    config: Config
    editUrl?: string | undefined
    frontmatter: Frontmatter
    lastModified?: string | undefined
  }
}

export function loader(options: loader.Options) {
  const { content } = options
  return {
    ...(content ? { content } : {}),
  }
}

declare namespace loader {
  export type Options = {
    content?: boolean | undefined
  }
}
