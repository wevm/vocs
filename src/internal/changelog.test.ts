import { describe, expect, test } from 'vitest'
import * as Changelog from './changelog.js'

describe('directive', () => {
  const releases: Changelog.Release[] = [
    {
      version: 'vocs@2.1.0',
      title: 'vocs@2.1.0',
      date: '2026-06-02T00:00:00.000Z',
      body: '# vocs@2.1.0\n\nFixed a thing.',
      url: 'https://example.com/releases/2.1.0',
    },
    {
      version: 'vocs@2.0.0',
      title: 'Big Bang',
      date: '2026-05-01T00:00:00.000Z',
      body: 'Everything changed.',
      url: 'https://example.com/releases/2.0.0',
    },
  ]

  function createAdapter() {
    const calls: Parameters<Changelog.Adapter['fetch']>[0][] = []
    const adapter: Changelog.Adapter = {
      type: 'mock',
      async fetch(options = {}) {
        calls.push(options)
        return releases.slice(0, options.limit ?? releases.length)
      },
    }
    return { adapter, calls }
  }

  test('respects the limit attribute', async () => {
    const { adapter, calls } = createAdapter()
    const markdown = await Changelog.directive({ adapter }).toMarkdown?.({ limit: '1' })

    expect(calls[0]?.limit).toBe(1)
    expect(markdown).toContain('vocs@2.1.0')
    expect(markdown).not.toContain('vocs@2.0.0')
  })

  test('defaults the limit when omitted', async () => {
    const { adapter, calls } = createAdapter()
    await Changelog.directive({ adapter }).toMarkdown?.({})

    expect(calls[0]?.limit).toBe(999)
  })

  test('falls back to the default on a malformed limit', async () => {
    const { adapter, calls } = createAdapter()
    const render = Changelog.directive({ adapter }).toMarkdown
    await render?.({ limit: 'abc' })
    await render?.({ limit: '0' })
    await render?.({ limit: '-1' })

    expect(calls.map((options) => options?.limit)).toEqual([999, 999, 999])
  })

  test('formats release headings and strips duplicate titles', async () => {
    const { adapter } = createAdapter()
    const markdown = await Changelog.directive({ adapter }).toMarkdown?.({})

    // Title matching the version collapses into the heading; the duplicate
    // leading H1 in the body is stripped.
    expect(markdown).toContain('## vocs@2.1.0 (2026-06-02)\n\nFixed a thing.')
    // A distinct title is appended to the heading.
    expect(markdown).toContain('## vocs@2.0.0 — Big Bang (2026-05-01)\n\nEverything changed.')
  })

  test('degrades to a comment without an adapter', async () => {
    expect(await Changelog.directive({}).toMarkdown?.({})).toBe('<!-- changelog unavailable -->')
  })
})

describe('stripDuplicateTitle', () => {
  test('strips a leading H1 that duplicates the title', () => {
    expect(Changelog.stripDuplicateTitle({ body: '# v1.0.0\n\nBody text.', title: 'v1.0.0' })).toBe(
      'Body text.',
    )
  })

  test('keeps a leading H1 that differs from the title', () => {
    const body = '# Breaking Changes\n\nBody text.'
    expect(Changelog.stripDuplicateTitle({ body, title: 'v1.0.0' })).toBe(body)
  })

  test('matches loosely across case, whitespace and unicode dashes', () => {
    expect(
      Changelog.stripDuplicateTitle({
        body: '# Release v1.6.0 — T3  Update\n\nBody.',
        title: 'release v1.6.0 - t3 update',
      }),
    ).toBe('Body.')
  })

  test('returns the body unchanged when body or title is empty', () => {
    expect(Changelog.stripDuplicateTitle({ body: '', title: 'v1.0.0' })).toBe('')
    expect(Changelog.stripDuplicateTitle({ body: '# v1.0.0\n\nBody.', title: '' })).toBe(
      '# v1.0.0\n\nBody.',
    )
  })
})
