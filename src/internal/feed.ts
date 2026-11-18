/**
 * Pure RSS 2.0 and Atom feed builders. Workers-safe: a server can build a feed per request from a
 * runtime origin.
 */
import * as Xml from './xml.js'

/**
 * Returns an RSS 2.0 document. Items appear in the given order (typically newest first).
 *
 * @example
 * ```ts
 * Feed.rss({
 *   title: 'Example Blog',
 *   url: 'https://example.com/blog',
 *   description: 'News from Example.',
 *   items: [{ title: 'Hello', url: 'https://example.com/blog/hello', date: '2026-01-02' }],
 * })
 * ```
 */
export function rss(options: rss.Options): string {
  const items = options.items.map((item) =>
    [
      '  <item>',
      `    <title>${Xml.encode(item.title)}</title>`,
      `    <link>${Xml.encode(item.url)}</link>`,
      `    <guid>${Xml.encode(item.id ?? item.url)}</guid>`,
      item.description
        ? `    <description>${Xml.encode(item.description)}</description>`
        : undefined,
      `    <pubDate>${new Date(item.date).toUTCString()}</pubDate>`,
      '  </item>',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${Xml.encode(options.title)}</title>`,
    `  <link>${Xml.encode(options.url)}</link>`,
    `  <description>${Xml.encode(options.description ?? options.title)}</description>`,
    options.self
      ? `  <atom:link href="${Xml.encode(options.self)}" rel="self" type="application/rss+xml"/>`
      : undefined,
    ...items,
    '</channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

export declare namespace rss {
  type Options = {
    /** Channel description. @default title */
    description?: string | undefined
    items: readonly Item[]
    /** Absolute URL of the feed itself. */
    self?: string | undefined
    title: string
    /** Absolute URL of the site or page the feed follows. */
    url: string
  }
}

/** Returns an Atom document. Its `updated` is the newest item's date unless given. */
export function atom(options: atom.Options): string {
  const dates = options.items.map((item) => new Date(item.date).getTime())
  const updated = new Date(options.updated ?? (dates.length ? Math.max(...dates) : 0))
  const entries = options.items.map((item) => {
    const date = new Date(item.date).toISOString()
    return [
      '  <entry>',
      `    <title>${Xml.encode(item.title)}</title>`,
      `    <id>${Xml.encode(item.id ?? item.url)}</id>`,
      `    <link href="${Xml.encode(item.url)}"/>`,
      `    <published>${date}</published>`,
      `    <updated>${date}</updated>`,
      item.description ? `    <summary>${Xml.encode(item.description)}</summary>` : undefined,
      '  </entry>',
    ]
      .filter(Boolean)
      .join('\n')
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${Xml.encode(options.title)}</title>`,
    `  <id>${Xml.encode(options.id ?? options.url)}</id>`,
    options.self ? `  <link href="${Xml.encode(options.self)}" rel="self"/>` : undefined,
    `  <link href="${Xml.encode(options.url)}"/>`,
    options.author ? `  <author><name>${Xml.encode(options.author)}</name></author>` : undefined,
    `  <updated>${updated.toISOString()}</updated>`,
    ...entries,
    '</feed>',
    '',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

export declare namespace atom {
  type Options = {
    author?: string | undefined
    /** Feed identity. @default url */
    id?: string | undefined
    items: readonly Item[]
    /** Absolute URL of the feed itself. */
    self?: string | undefined
    title: string
    /** Overrides the newest item's date. */
    updated?: string | Date | undefined
    /** Absolute URL of the site or page the feed follows. */
    url: string
  }
}

export type Item = {
  /** Publish date: a `Date` or a date string. */
  date: string | Date
  description?: string | undefined
  /** Stable identity. @default url */
  id?: string | undefined
  title: string
  /** Absolute URL of the item. */
  url: string
}
