/**
 * Pure `sitemap.xml`, sitemap index, and `robots.txt` builders. Workers-safe: a server can build
 * them per request from a runtime origin, and the Vocs build writes the same format.
 */
import * as Xml from './xml.js'

/**
 * Returns a `<urlset>` sitemap. Each URL may list its translations as `hreflang` alternates.
 *
 * @example
 * ```ts
 * Sitemap.urlset({
 *   urls: [
 *     {
 *       loc: 'https://example.com/guide',
 *       lastmod: '2026-01-02',
 *       alternates: [{ hreflang: 'de', href: 'https://example.com/de/guide' }],
 *     },
 *   ],
 * })
 * ```
 */
export function urlset(options: urlset.Options): string {
  const { urls } = options
  const alternates = urls.some((url) => url.alternates?.length)
  const entries = urls.map((url) =>
    [
      '  <url>',
      `    <loc>${Xml.encode(url.loc)}</loc>`,
      url.lastmod ? `    <lastmod>${Xml.encode(date(url.lastmod))}</lastmod>` : undefined,
      url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : undefined,
      url.priority !== undefined ? `    <priority>${url.priority}</priority>` : undefined,
      ...(url.alternates ?? []).map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${Xml.encode(alternate.hreflang)}" href="${Xml.encode(alternate.href)}"/>`,
      ),
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${alternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>`,
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}

export declare namespace urlset {
  type Options = {
    urls: readonly Url[]
  }

  type Url = {
    /** Translations of the page, including the page itself, as `<xhtml:link>` alternates. */
    alternates?: readonly { href: string; hreflang: string }[] | undefined
    changefreq?:
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never'
      | undefined
    /** Last change: a `Date`, or a W3C date string such as `2026-01-02`. */
    lastmod?: string | Date | undefined
    /** Absolute URL of the page. */
    loc: string
    priority?: number | undefined
  }
}

/** Returns a `<sitemapindex>` that lists other sitemaps. */
export function index(options: index.Options): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...options.sitemaps.map((sitemap) =>
      [
        '  <sitemap>',
        `    <loc>${Xml.encode(sitemap.loc)}</loc>`,
        sitemap.lastmod ? `    <lastmod>${Xml.encode(date(sitemap.lastmod))}</lastmod>` : undefined,
        '  </sitemap>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '</sitemapindex>',
    '',
  ].join('\n')
}

export declare namespace index {
  type Options = {
    sitemaps: readonly { lastmod?: string | Date | undefined; loc: string }[]
  }
}

/**
 * Returns `robots.txt`: one group of rules per user agent (or list of agents), followed by the
 * sitemap URLs.
 *
 * @example
 * ```ts
 * Sitemap.robots({
 *   groups: [
 *     { userAgent: ['GPTBot', 'ClaudeBot'], allow: ['/'], disallow: ['/private/'] },
 *     { userAgent: '*', allow: ['/'] },
 *   ],
 *   sitemaps: ['https://example.com/sitemap.xml'],
 * })
 * ```
 */
export function robots(options: robots.Options = {}): string {
  const { groups = [{ userAgent: '*', allow: ['/'] }], sitemaps = [] } = options
  const blocks = groups.map((group) =>
    [
      ...[group.userAgent].flat().map((agent) => `User-agent: ${agent}`),
      ...(group.allow ?? []).map((path) => `Allow: ${path}`),
      ...(group.disallow ?? []).map((path) => `Disallow: ${path}`),
    ].join('\n'),
  )
  if (sitemaps.length) blocks.push(sitemaps.map((sitemap) => `Sitemap: ${sitemap}`).join('\n'))
  return `${blocks.join('\n\n')}\n`
}

export declare namespace robots {
  type Options = {
    /** @default [{ userAgent: '*', allow: ['/'] }] */
    groups?: readonly Group[] | undefined
    /** Absolute sitemap URLs. */
    sitemaps?: readonly string[] | undefined
  }

  type Group = {
    allow?: readonly string[] | undefined
    disallow?: readonly string[] | undefined
    /** A user agent, or several that share the group's rules. */
    userAgent: string | readonly string[]
  }
}

function date(value: string | Date) {
  return typeof value === 'string' ? value : value.toISOString()
}
