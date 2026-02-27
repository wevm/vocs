import { describe, expect, test, vi } from 'vitest'
import { matchIcon, resolveIcon, resolveIconSync } from './icons.js'

describe('resolveIconSync', () => {
  test('returns inline svg as-is', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
    expect(resolveIconSync(svg)).toBe(svg)
  })

  test('resolves lucide icon', () => {
    const result = resolveIconSync('lucide:arrow-right')
    expect(result).toBeDefined()
    expect(result).toContain('<svg')
    expect(result).toContain('</svg>')
  })

  test('resolves simple-icons icon', () => {
    const result = resolveIconSync('simple-icons:github')
    expect(result).toBeDefined()
    expect(result).toContain('<svg')
  })

  test('resolves vscode-icons icon', () => {
    const result = resolveIconSync('vscode-icons:file-type-js')
    expect(result).toBeDefined()
    expect(result).toContain('<svg')
  })

  test('returns undefined for unknown collection', () => {
    expect(resolveIconSync('nonexistent:icon')).toBeUndefined()
  })

  test('returns undefined for unknown icon in valid collection', () => {
    expect(resolveIconSync('lucide:nonexistent-icon-xyz')).toBeUndefined()
  })

  test('returns undefined for invalid format (no colon)', () => {
    expect(resolveIconSync('nocolon')).toBeUndefined()
  })

  test('returns undefined for empty string parts', () => {
    expect(resolveIconSync(':')).toBeUndefined()
    expect(resolveIconSync('lucide:')).toBeUndefined()
  })

  test('does not handle URL icons', () => {
    const result = resolveIconSync('https://example.com/icon.svg')
    // URL strings are not handled by the sync path — they should fall through
    // and fail to match a collection, returning undefined
    expect(result).toBeUndefined()
  })
})

describe('resolveIcon', () => {
  test('returns inline svg as-is', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
    expect(await resolveIcon(svg)).toBe(svg)
  })

  test('delegates to resolveIconSync for collection icons', async () => {
    const syncResult = resolveIconSync('lucide:arrow-right')
    const asyncResult = await resolveIcon('lucide:arrow-right')
    expect(asyncResult).toBe(syncResult)
  })

  test('fetches URL icons', async () => {
    const svgContent = '<svg><rect/></svg>'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(svgContent),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await resolveIcon('https://example.com/icon.svg')
    expect(result).toBe(svgContent)
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/icon.svg')

    vi.unstubAllGlobals()
  })

  test('returns undefined when URL fetch fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', mockFetch)

    const result = await resolveIcon('https://example.com/icon.svg')
    expect(result).toBeUndefined()

    vi.unstubAllGlobals()
  })

  test('returns undefined when URL fetch throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', mockFetch)

    const result = await resolveIcon('https://example.com/icon.svg')
    expect(result).toBeUndefined()

    vi.unstubAllGlobals()
  })

  test('handles http:// URLs', async () => {
    const svgContent = '<svg><rect/></svg>'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(svgContent),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await resolveIcon('http://example.com/icon.svg')
    expect(result).toBe(svgContent)

    vi.unstubAllGlobals()
  })
})

describe('matchIcon', () => {
  test('matches file extension', () => {
    expect(matchIcon('app.tsx')).toBe('vscode-icons:file-type-reactts')
    expect(matchIcon('index.ts')).toBe('vscode-icons:file-type-typescript')
    expect(matchIcon('style.css')).toBe('vscode-icons:file-type-css')
  })

  test('matches config file', () => {
    expect(matchIcon('vite.config.ts')).toBe('vscode-icons:file-type-vite')
    expect(matchIcon('package.json')).toBe('vscode-icons:file-type-npm')
  })

  test('matches package manager', () => {
    expect(matchIcon('pnpm')).toBe('vscode-icons:file-type-light-pnpm')
    expect(matchIcon('npm')).toBe('vscode-icons:file-type-npm')
  })

  test('returns undefined for unrecognized file', () => {
    expect(matchIcon('unknown-file-xyz')).toBeUndefined()
  })

  test('prefers custom icons over builtins', () => {
    const custom = { '.ts': 'custom:typescript' }
    expect(matchIcon('file.ts', custom)).toBe('custom:typescript')
  })
})
