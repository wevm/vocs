import { describe, expect, it } from 'vitest'
import { append, fuse } from './search-fusion.js'

type Doc = { href: string; source?: string }

describe('fuse', () => {
  it('de-duplicates by href and keeps the keyword object', () => {
    const keyword: Doc[] = [{ href: '/a', source: 'kw' }]
    const semantic: Doc[] = [{ href: '/a', source: 'sem' }]
    const fused = fuse({ keyword, semantic })
    expect(fused).toHaveLength(1)
    expect(fused[0]?.source).toBe('kw')
  })

  it('ranks items appearing in both lists above single-list items', () => {
    const keyword: Doc[] = [{ href: '/only-kw' }, { href: '/both' }]
    const semantic: Doc[] = [{ href: '/only-sem' }, { href: '/both' }]
    const fused = fuse({ keyword, semantic })
    expect(fused[0]?.href).toBe('/both')
    expect(fused.map((d) => d.href).sort()).toEqual(['/both', '/only-kw', '/only-sem'])
  })

  it('weights bias single-list ordering', () => {
    // `/kw` is rank 0 in keyword; `/sem` is rank 0 in semantic. With a heavy
    // semantic weight, the semantic-only item should win.
    const keyword: Doc[] = [{ href: '/kw' }]
    const semantic: Doc[] = [{ href: '/sem' }]
    const semanticFirst = fuse({ keyword, semantic, keywordWeight: 0.1, semanticWeight: 0.9 })
    expect(semanticFirst[0]?.href).toBe('/sem')
    const keywordFirst = fuse({ keyword, semantic, keywordWeight: 0.9, semanticWeight: 0.1 })
    expect(keywordFirst[0]?.href).toBe('/kw')
  })

  it('respects rank order within a single list', () => {
    const keyword: Doc[] = [{ href: '/1' }, { href: '/2' }, { href: '/3' }]
    const fused = fuse({ keyword, semantic: [] })
    expect(fused.map((d) => d.href)).toEqual(['/1', '/2', '/3'])
  })

  it('applies the limit', () => {
    const keyword: Doc[] = Array.from({ length: 10 }, (_, i) => ({ href: `/${i}` }))
    const fused = fuse({ keyword, semantic: [], limit: 3 })
    expect(fused).toHaveLength(3)
  })

  it('handles empty inputs', () => {
    expect(fuse({ keyword: [], semantic: [] })).toEqual([])
  })
})

describe('append', () => {
  it('keeps keyword order and appends semantic-only items below', () => {
    const keyword: Doc[] = [{ href: '/a' }, { href: '/b' }]
    const semantic: Doc[] = [{ href: '/b', source: 'sem' }, { href: '/c' }]
    expect(append(keyword, semantic).map((d) => d.href)).toEqual(['/a', '/b', '/c'])
  })

  it('keeps the keyword object on duplicate hrefs', () => {
    const keyword: Doc[] = [{ href: '/a', source: 'kw' }]
    const semantic: Doc[] = [{ href: '/a', source: 'sem' }]
    const merged = append(keyword, semantic)
    expect(merged).toHaveLength(1)
    expect(merged[0]?.source).toBe('kw')
  })

  it('applies the limit', () => {
    const keyword: Doc[] = [{ href: '/1' }, { href: '/2' }]
    const semantic: Doc[] = [{ href: '/3' }, { href: '/4' }]
    expect(append(keyword, semantic, 3)).toHaveLength(3)
  })
})
