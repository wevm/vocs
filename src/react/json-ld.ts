import type * as Config from '../internal/config.js'

type JsonLd = Record<string, unknown>

export function from(options: from.Options): JsonLd {
  const { canonical, description, frontmatter, siteName, siteUrl, title } = options
  const author = toAuthor(frontmatter?.author)
  const date = frontmatter?.['date']
  const datePublished = typeof date === 'string' ? date : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    ...(description && description !== 'undefined' ? { description } : {}),
    ...(canonical
      ? {
          mainEntityOfPage: {
            '@id': canonical,
            '@type': 'WebPage',
          },
          url: canonical,
        }
      : {}),
    ...(author ? { author } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(frontmatter?.lastModified ? { dateModified: frontmatter.lastModified } : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      ...(siteUrl ? { url: siteUrl } : {}),
    },
  }
}

export declare namespace from {
  export type Options = {
    canonical?: string | undefined
    description?: string | undefined
    frontmatter?: Config.Frontmatter | undefined
    siteName: string
    siteUrl?: string | undefined
    title: string
  }
}

export function serialize(value: JsonLd): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const replacements: Record<string, string> = {
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
      '\u2028': '\\u2028',
      '\u2029': '\\u2029',
    }
    return replacements[character] ?? character
  })
}

function toAuthor(author: string | undefined): JsonLd | undefined {
  if (!author) return undefined

  const match = author.match(/^\[([^\]]+)]\(([^)]+)\)$/)
  if (match) return { '@type': 'Person', name: match[1], url: match[2] }
  return { '@type': 'Person', name: author }
}
