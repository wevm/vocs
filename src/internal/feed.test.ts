import { expect, test } from 'vitest'
import * as Feed from './feed.js'

const items = [
  {
    title: 'Fees & <limits>',
    url: 'https://example.com/blog/fees',
    description: 'What changed.',
    date: '2026-03-01T00:00:00Z',
  },
  { title: 'Hello', url: 'https://example.com/blog/hello', date: new Date('2026-01-02T00:00:00Z') },
]

test('rss', () => {
  expect(
    Feed.rss({
      title: 'Example',
      url: 'https://example.com/blog',
      self: 'https://example.com/rss.xml',
      items,
    }),
  ).toMatchInlineSnapshot(`
    "<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Example</title>
      <link>https://example.com/blog</link>
      <description>Example</description>
      <atom:link href="https://example.com/rss.xml" rel="self" type="application/rss+xml"/>
      <item>
        <title>Fees &amp; &lt;limits&gt;</title>
        <link>https://example.com/blog/fees</link>
        <guid>https://example.com/blog/fees</guid>
        <description>What changed.</description>
        <pubDate>Sun, 01 Mar 2026 00:00:00 GMT</pubDate>
      </item>
      <item>
        <title>Hello</title>
        <link>https://example.com/blog/hello</link>
        <guid>https://example.com/blog/hello</guid>
        <pubDate>Fri, 02 Jan 2026 00:00:00 GMT</pubDate>
      </item>
    </channel>
    </rss>
    "
  `)
})

test('atom updates at the newest item', () => {
  const atom = Feed.atom({
    title: 'Example',
    url: 'https://example.com/',
    author: 'Example',
    items: [...items].reverse(),
  })
  expect(atom).toContain('<updated>2026-03-01T00:00:00.000Z</updated>\n  <entry>')
  expect(atom).toContain('<title>Fees &amp; &lt;limits&gt;</title>')
  expect(atom).toContain('<link href="https://example.com/blog/hello"/>')
  expect(Feed.atom({ title: 'Empty', url: 'https://example.com/', items: [] })).toContain(
    '<updated>1970-01-01T00:00:00.000Z</updated>',
  )
})
