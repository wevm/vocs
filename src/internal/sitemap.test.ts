import { expect, test } from 'vitest'
import * as Sitemap from './sitemap.js'

test('urlset escapes locations and lists hreflang alternates', () => {
  expect(
    Sitemap.urlset({
      urls: [
        {
          loc: 'https://example.com/search?q=a&b',
          lastmod: new Date('2026-01-02T00:00:00Z'),
          alternates: [
            { hreflang: 'en', href: 'https://example.com/search?q=a&b' },
            { hreflang: 'de', href: 'https://example.com/de/search' },
          ],
        },
        { loc: 'https://example.com/guide', lastmod: '2026-01-03', priority: 0.5 },
      ],
    }),
  ).toMatchInlineSnapshot(`
    "<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <url>
        <loc>https://example.com/search?q=a&amp;b</loc>
        <lastmod>2026-01-02T00:00:00.000Z</lastmod>
        <xhtml:link rel="alternate" hreflang="en" href="https://example.com/search?q=a&amp;b"/>
        <xhtml:link rel="alternate" hreflang="de" href="https://example.com/de/search"/>
      </url>
      <url>
        <loc>https://example.com/guide</loc>
        <lastmod>2026-01-03</lastmod>
        <priority>0.5</priority>
      </url>
    </urlset>
    "
  `)
  expect(Sitemap.urlset({ urls: [{ loc: 'https://example.com/' }] })).not.toContain('xmlns:xhtml')
})

test('index lists sitemaps', () => {
  expect(
    Sitemap.index({ sitemaps: [{ loc: 'https://example.com/sitemap-pages.xml' }] }),
  ).toMatchInlineSnapshot(`
    "<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://example.com/sitemap-pages.xml</loc>
      </sitemap>
    </sitemapindex>
    "
  `)
})

test('robots writes one group per agent list, then the sitemaps', () => {
  expect(Sitemap.robots({ sitemaps: ['https://example.com/sitemap.xml'] })).toBe(
    'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n',
  )
  expect(
    Sitemap.robots({
      groups: [
        { userAgent: ['GPTBot', 'Claude-User'], allow: ['/'], disallow: ['/private/'] },
        { userAgent: '*', disallow: ['/'] },
      ],
    }),
  ).toBe(
    'User-agent: GPTBot\nUser-agent: Claude-User\nAllow: /\nDisallow: /private/\n\nUser-agent: *\nDisallow: /\n',
  )
})
