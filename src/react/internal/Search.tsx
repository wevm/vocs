'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cx } from 'cva'
import MiniSearch from 'minisearch'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideExternalLink from '~icons/lucide/external-link'
import LucideFile from '~icons/lucide/file'
import LucideHash from '~icons/lucide/hash'
import LucideLoaderCircle from '~icons/lucide/loader-circle'
import LucideSearch from '~icons/lucide/search'
import * as Path from '../../internal/path.js'
import { SearchConfig } from '../../internal/search.client.js'
import { append, fuse } from '../../internal/search-fusion.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'
import { DialogTrigger } from './DialogTrigger.js'

namespace styles {
  export const search = style({ height: '100%', width: '100%' })
  export const search2 = style({
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    backgroundColor: 'color-mix(in oklab, black 60%, transparent)',
    backdropFilter: 'blur(8px)',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&[data-ending-style]': { opacity: '0%' },
      '&[data-starting-style]': { opacity: '0%' },
    },
  })
  export const search3 = style({
    position: 'fixed',
    top: '5%',
    left: 'calc(1 / 2 * 100%)',
    zIndex: 101,
    display: 'flex',
    maxHeight: '70vh',
    width: '90vw',
    maxWidth: '600px',
    transformOrigin: 'top',
    translate: 'calc(calc(1 / 2 * 100%) * -1) 0',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '2xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&[data-ending-style]': {
        scale: '95% 95%',
        opacity: '0%',
        translate: 'calc(calc(1 / 2 * 100%) * -1) 0',
        borderStyle: 'solid',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-starting-style]': {
        scale: '95% 95%',
        opacity: '0%',
        translate: 'calc(calc(1 / 2 * 100%) * -1) 0',
        borderStyle: 'solid',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    '@media (width >= 40rem)': { top: '15%' },
  })
  export const search4 = style({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  })
  export const search5 = style({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  })
  export const search6 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingInline: 4,
    paddingBlock: 3,
  })
  export const search7 = style({
    width: 5,
    height: 5,
    flexShrink: 0,
    color: theme.vars.color.gray['900'],
  })
  export const search8 = style({
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 'base',
    lineHeight: 'calc(1.5 / 1)',
    color: theme.vars.color.foreground,
    outlineStyle: 'none',
    selectors: { '&::placeholder': { color: theme.vars.color.gray['900'] } },
  })
  export const search9 = style({
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: 2,
  })
  export const search10 = style({
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
  export const search11 = style({
    width: 4,
    height: 4,
    flexShrink: 0,
    animation: 'spin 1s linear infinite',
    color: theme.vars.color.gray['900'],
  })
  export const search12 = style({ flex: 1, overflowY: 'auto', paddingBlock: 2 })
  export const search13 = style({
    paddingInline: 4,
    paddingBlock: 2,
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    fontWeight: 'medium',
    color: theme.vars.color.gray['900'],
  })
  export const search14 = style({
    paddingInline: 4,
    paddingBlock: 8,
    textAlign: 'center',
    color: theme.vars.color.gray['900'],
  })
  export const search15 = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingInline: 4,
    paddingBlock: 2,
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
    '@media (width < 40rem)': { display: 'none' },
  })
  export const search16 = style({ display: 'flex', alignItems: 'center', gap: 3 })
  export const search17 = style({ display: 'flex', alignItems: 'center', gap: 1 })
  export const search18 = style({
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 1.5)',
    paddingBlock: 'calc(0.25rem * 0.5)',
    fontSize: '10px',
  })
  export const search19 = style({
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 1.5)',
    paddingBlock: 'calc(0.25rem * 0.5)',
    fontSize: '10px',
  })
  export const search20 = style({ display: 'flex', alignItems: 'center', gap: 1 })
  export const search21 = style({
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 1.5)',
    paddingBlock: 'calc(0.25rem * 0.5)',
    fontSize: '10px',
  })
  export const search22 = style({ display: 'flex', alignItems: 'center', gap: 1 })
  export const search23 = style({
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 1.5)',
    paddingBlock: 'calc(0.25rem * 0.5)',
    fontSize: '10px',
  })
  export const result = style({
    cursor: 'pointer',
    paddingInline: 4,
    paddingBlock: 2,
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] } },
      '&[data-selected="true"]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: theme.vars.color.foreground,
      },
    },
  })
  export const result2 = style({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 3,
  })
  export const result3 = style({
    marginTop: 'calc(0.25rem * 0.5)',
    width: 4,
    height: 4,
    flexShrink: 0,
    color: theme.vars.color.gray['900'],
    selectors: {
      '&:is(:where(.vocs-group)[data-selected="true"] *)': { color: theme.vars.color.blue['900'] },
    },
  })
  export const result4 = style({
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 'calc(0.25rem * 0.5)',
  })
  export const result5 = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
  export const result6 = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
  })
  export const result7 = style({
    overflow: 'hidden',
    lineClamp: 2,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
  })
  export const resultSkeleton = style({ display: 'flex', flexDirection: 'column' })
  export const resultSkeleton2 = style({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 3,
    paddingInline: 4,
    paddingBlock: 2,
  })
  export const resultSkeleton3 = style({
    marginTop: 'calc(0.25rem * 0.5)',
    width: 4,
    height: 4,
    flexShrink: 0,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const resultSkeleton4 = style({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 'calc(0.25rem * 1.5)',
  })
  export const resultSkeleton5 = style({
    height: 3,
    width: 'calc(1 / 3 * 100%)',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const resultSkeleton6 = style({
    height: 3,
    width: 'calc(3 / 4 * 100%)',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const jumpTo = style({
    cursor: 'pointer',
    paddingInline: 4,
    paddingBlock: 2,
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] } },
      '&[data-selected="true"]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: theme.vars.color.foreground,
      },
    },
  })
  export const jumpTo2 = style({ display: 'flex', alignItems: 'center', gap: 2 })
  export const jumpTo3 = style({
    marginRight: 1,
    width: 4,
    height: 4,
    flexShrink: 0,
    color: theme.vars.color.gray['900'],
    selectors: {
      '&:is(:where(.vocs-group)[data-selected="true"] *)': { color: theme.vars.color.blue['900'] },
    },
  })
  export const jumpTo4 = style({ color: theme.vars.color.gray['900'] })
  export const jumpTo5 = style({ fontWeight: 'medium', color: theme.vars.color.foreground })
  export const highlightMatches = style({
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.blue['400'],
    color: theme.vars.color.blue['900'],
  })
}

const recentSearchesKey = 'vocs-recent-searches'
const maxRecentSearches = 5

type SearchResult = {
  category: string
  href: string
  id: string
  match: Record<string, string[]>
  queryTerms: string[]
  score: number
  terms: string[]
  text: string
  title: string
  titles: string[]
  type: 'page' | 'section' | 'nav'
}

type SearchState = {
  results: SearchResult[]
  selectedIndex: number
}

/**
 * Public semantic-search config shape. `config.ai.retriever` resolves to this
 * for either provider (a built-in vector store or a managed retriever), so the
 * dialog treats them uniformly.
 */
type SemanticConfig = {
  enabled: boolean
  endpoint: string
  hybrid?: { enabled: boolean; semanticWeight: number; keywordWeight: number } | undefined
  /** Only present for the self-owned provider; managed retrievers query at runtime. */
  runtime?: 'server' | 'client' | undefined
  ui?: { debounceMs?: number } | undefined
}

/** Result shape returned by the `/api/search` endpoint. */
type SemanticResult = {
  id: string
  href: string
  title: string
  titles: string[]
  category: string
  type: 'page' | 'section' | 'nav'
  snippet: string
  score: number
}

/** Adapts a semantic endpoint result to the keyword `SearchResult` shape for reuse. */
function toSearchResult(result: SemanticResult): SearchResult {
  return {
    category: result.category,
    href: result.href,
    id: result.id,
    match: {},
    queryTerms: [],
    score: result.score,
    terms: [],
    text: result.snippet,
    title: result.title,
    titles: result.titles,
    type: result.type,
  }
}

const initialSearchState: SearchState = {
  results: [],
  selectedIndex: 0,
}

export function Search(props: Search.Props) {
  const { className, disableKeyboardShortcut, trigger } = props

  const config = useConfig()
  const [query, setQuery] = useQueryState('q', { defaultValue: '' })
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState<SearchState>(initialSearchState)

  // Open search dialog on initial page load with `q` query param
  // Only the primary search (without disableKeyboardShortcut) should auto-open
  const didHandleInitialQuery = React.useRef(false)
  React.useEffect(() => {
    if (disableKeyboardShortcut) return
    if (didHandleInitialQuery.current) return
    didHandleInitialQuery.current = true
    if (query.trim()) setOpen(true)
  }, [query, disableKeyboardShortcut])
  const [recentSearches, setRecentSearches] = React.useState<SearchResult[]>([])
  const [index, setIndex] = React.useState<MiniSearch<SearchResult> | null>(null)

  const listRef = React.useRef<HTMLUListElement>(null)
  const router = useRouter()

  // AI (semantic) search. `ai.retriever` selects one provider — a built-in vector
  // store or a managed retriever — and both serialize to the same public shape
  // and request/response contract, so the dialog treats them uniformly. We fetch
  // semantic results in the background and blend them with the instant MiniSearch
  // keyword results (fused into one ranking by default; `hybrid: false` appends
  // them below instead). Keyword results render immediately; the list updates
  // once semantic results return, so the UI never blocks on the network.
  const aiConfig = (config as { ai?: { retriever?: SemanticConfig } }).ai?.retriever
  const semanticConfig = React.useMemo<SemanticConfig | undefined>(() => {
    // The self-owned provider only queries the server endpoint in server runtime.
    if (aiConfig?.enabled && aiConfig.runtime !== 'client') return aiConfig
    return undefined
  }, [aiConfig])
  const semanticEnabled = Boolean(semanticConfig?.enabled)
  const [semanticResults, setSemanticResults] = React.useState<SearchResult[]>([])
  // The query the current `semanticResults` were fetched for. While a newer
  // query is in flight this won't match `query`, so we fall back to keyword
  // results instead of showing stale AI results.
  const [semanticResultsQuery, setSemanticResultsQuery] = React.useState('')
  const [semanticLoading, setSemanticLoading] = React.useState(false)

  React.useEffect(() => {
    if (!semanticEnabled || !open || !query.trim() || !semanticConfig?.endpoint) {
      setSemanticResults([])
      setSemanticLoading(false)
      return
    }
    const controller = new AbortController()
    const debounce = semanticConfig.ui?.debounceMs ?? 250
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const fail = (error: unknown): void => {
      if ((error as Error).name === 'AbortError') return
      setSemanticResults([])
      setSemanticLoading(false)
    }

    const run = async (): Promise<void> => {
      const response = await fetch(semanticConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Semantic search failed: ${response.status}`)
      const data = (await response.json()) as { results: SemanticResult[]; indexing?: boolean }
      // The built-in AI search store builds its vector index on first use. While it's
      // still indexing we keep showing keyword results and poll until it's
      // ready, rather than blocking the request or surfacing an error. Managed
      // retrievers never set `indexing`.
      if (data.indexing) {
        retryTimer = setTimeout(() => {
          run().catch(fail)
        }, 1500)
        return
      }
      setSemanticResults(data.results.map(toSearchResult))
      setSemanticResultsQuery(query)
      setSemanticLoading(false)
    }

    const timer = setTimeout(() => {
      setSemanticLoading(true)
      run().catch(fail)
    }, debounce)
    return () => {
      controller.abort()
      clearTimeout(timer)
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [semanticEnabled, open, query, semanticConfig?.endpoint, semanticConfig?.ui?.debounceMs])

  const displayedResults = React.useMemo(() => {
    if (!query.trim()) return recentSearches
    // Ignore AI results that belong to a previous query — while a new request is
    // in flight, show fresh keyword results rather than stale AI ones.
    const semanticFresh = semanticEnabled && semanticResultsQuery === query ? semanticResults : []
    if (semanticFresh.length === 0) return search.results
    // `hybrid: false` opts into append mode: keyword ordering stays put and AI
    // results follow below. Fusion is the default.
    if (!semanticConfig?.hybrid?.enabled) return append(search.results, semanticFresh, 20)
    return fuse({
      keyword: search.results,
      semantic: semanticFresh,
      keywordWeight: semanticConfig.hybrid.keywordWeight,
      semanticWeight: semanticConfig.hybrid.semanticWeight,
      limit: 20,
    })
  }, [
    query,
    semanticEnabled,
    semanticResults,
    semanticResultsQuery,
    search.results,
    recentSearches,
    semanticConfig?.hybrid,
  ])

  const jumpToResult = React.useMemo(() => {
    if (!query.trim() || search.results.length === 0) return null

    const q = query.toLowerCase().trim()
    const result = search.results.find((r) => r.title.toLowerCase().startsWith(q))

    if (result?.type === 'page') return result
    return null
  }, [query, search.results])

  React.useEffect(() => {
    if (!open || index) return

    import('virtual:vocs/search-index')
      .then(async ({ getSearchIndex }) => {
        const json = await getSearchIndex()
        setIndex(
          MiniSearch.loadJSON<SearchResult>(json, {
            ...SearchConfig.getIndexOptions(config),
          }),
        )
      })
      .catch((error) => console.error('Failed to load search index:', error))
  }, [open, index, config])

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(recentSearchesKey)
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!index || !query.trim()) {
      setSearch((s) => (s.results.length ? { ...s, results: [], selectedIndex: 0 } : s))
      return
    }

    const results = (
      index.search(query, SearchConfig.getQueryOptions(config)) as SearchResult[]
    ).slice(0, 20)
    setSearch((s) => ({ ...s, results, selectedIndex: 0 }))
  }, [query, index, config])

  React.useEffect(() => {
    if (disableKeyboardShortcut) return

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [disableKeyboardShortcut])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) {
        setQuery(null)
        setSearch(initialSearchState)
      }
    },
    [setQuery],
  )

  const saveRecentSearch = React.useCallback((result: SearchResult) => {
    setRecentSearches((prev) => {
      const updated = [result, ...prev.filter((r) => r.id !== result.id)].slice(
        0,
        maxRecentSearches,
      )
      try {
        localStorage.setItem(recentSearchesKey, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  const handleResultClick = React.useCallback(
    (result: SearchResult) => {
      saveRecentSearch(result)
      setOpen(false)
      setQuery(null)
      setSearch(initialSearchState)
    },
    [saveRecentSearch, setQuery],
  )

  const allItems = React.useMemo(() => {
    if (jumpToResult) return [jumpToResult, ...displayedResults]
    return displayedResults
  }, [jumpToResult, displayedResults])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const items = allItems

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSearch((s) => ({
            ...s,
            selectedIndex:
              s.selectedIndex < items.length - 1 ? s.selectedIndex + 1 : s.selectedIndex,
          }))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSearch((s) => ({
            ...s,
            selectedIndex: s.selectedIndex > 0 ? s.selectedIndex - 1 : s.selectedIndex,
          }))
          break
        case 'Enter': {
          event.preventDefault()
          const item = items[search.selectedIndex]
          if (item) {
            handleResultClick(item)
            if (Path.isExternal(item.href)) window.open(item.href, '_blank', 'noopener,noreferrer')
            else router.push(item.href)
          }
          break
        }
      }
    },
    [allItems, search.selectedIndex, handleResultClick, router],
  )

  React.useEffect(() => {
    const selectedItem = listRef.current?.children[search.selectedIndex] as HTMLElement | undefined
    selectedItem?.scrollIntoView({ block: 'nearest' })
  }, [search.selectedIndex])

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        className={cx(trigger ? undefined : styles.search().className, className)}
        render={
          trigger ?? (
            <DialogTrigger icon={LucideSearch} triggerKey="K">
              Search...
            </DialogTrigger>
          )
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.search2().className} />
        <Dialog.Popup className={styles.search3().className} onKeyDown={handleKeyDown}>
          <Dialog.Title className={styles.search4().className}>Search documentation</Dialog.Title>
          <Dialog.Description className={styles.search5().className}>
            Search through documentation pages. Use arrow keys to navigate, enter to select.
          </Dialog.Description>

          <div {...styles.search6()}>
            <LucideSearch className={styles.search7().className} />
            <input
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={displayedResults.length > 0}
              autoComplete="off"
              // biome-ignore lint/a11y/noAutofocus: _
              autoFocus
              {...styles.search8()}
              onChange={(e) => setQuery(e.target.value || null)}
              placeholder="Search..."
              role="combobox"
              spellCheck={false}
              type="text"
              value={query}
            />
            {semanticLoading && (
              <div {...styles.search9()}>
                <span {...styles.search10()}>Enhancing Results</span>
                <LucideLoaderCircle
                  aria-label="Searching"
                  className={styles.search11().className}
                />
              </div>
            )}
          </div>

          <div {...styles.search12()}>
            {allItems.length > 0 ? (
              <>
                {!query.trim() && <div {...styles.search13()}>Recent searches</div>}
                <ul
                  ref={listRef}
                  aria-label={query.trim() ? 'Search results' : 'Recent searches'}
                  id="search-results"
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
                  role="listbox"
                >
                  {jumpToResult && (
                    <JumpTo
                      onClick={() => handleResultClick(jumpToResult)}
                      queryTerms={query.trim().split(/\s+/)}
                      result={jumpToResult}
                      selected={search.selectedIndex === 0}
                    />
                  )}
                  {displayedResults.map((result, i) => {
                    const index = jumpToResult ? i + 1 : i
                    const queryTerms = !query.trim() ? [] : query.trim().split(/\s+/)
                    if (result.type === 'nav')
                      return (
                        <JumpTo
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          queryTerms={queryTerms}
                          result={result}
                          selected={index === search.selectedIndex}
                        />
                      )
                    return (
                      <Result
                        key={result.id}
                        queryTerms={queryTerms}
                        onClick={() => handleResultClick(result)}
                        result={result}
                        selected={index === search.selectedIndex}
                      />
                    )
                  })}
                </ul>
              </>
            ) : query.trim() && semanticLoading ? (
              <ResultSkeleton />
            ) : (
              <div {...styles.search14()}>
                {!query.trim() ? 'Start typing to search...' : 'No results found'}
              </div>
            )}
          </div>

          <div {...styles.search15()}>
            <div {...styles.search16()}>
              <span {...styles.search17()}>
                <kbd {...styles.search18()}>↑</kbd>
                <kbd {...styles.search19()}>↓</kbd>
                <span>navigate</span>
              </span>
              <span {...styles.search20()}>
                <kbd {...styles.search21()}>↵</kbd>
                <span>select</span>
              </span>
              <span {...styles.search22()}>
                <kbd {...styles.search23()}>esc</kbd>
                <span>close</span>
              </span>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export declare namespace Search {
  export type Props = {
    className?: string | undefined
    disableKeyboardShortcut?: boolean | undefined
    trigger?: React.ReactElement | undefined
  }
}

/** Renders an external result's origin for display: just the hostname. */
function formatExternalUrl(href: string): string {
  try {
    return new URL(href).hostname
  } catch {
    return href
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Result(props: Result.Props) {
  const { queryTerms, onClick, result, selected } = props

  const isExternal = Path.isExternal(result.href)
  const Icon = isExternal ? LucideExternalLink : result.type === 'page' ? LucideFile : LucideHash
  const breadcrumb = isExternal
    ? result.category || formatExternalUrl(result.href)
    : [result.category, ...result.titles].filter(Boolean).join(' › ') || null

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: _
    <li
      aria-selected={selected}
      className={styles.result({ className: 'vocs-group' }).className}
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link className={styles.result2().className} onClick={onClick} to={result.href}>
        <Icon className={styles.result3().className} />
        <div {...styles.result4()}>
          {breadcrumb && <div {...styles.result5()}>{breadcrumb}</div>}
          <div {...styles.result6()}>
            {queryTerms.length > 0
              ? highlightMatches(result.title, queryTerms, result.terms)
              : result.title}
          </div>
          {result.text && (
            <div {...styles.result7()}>
              {queryTerms.length > 0
                ? highlightMatches(
                    getSnippet(result.text, queryTerms, result.terms),
                    queryTerms,
                    result.terms,
                  )
                : result.text}
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}

declare namespace Result {
  type Props = {
    queryTerms: string[]
    onClick: () => void
    result: SearchResult
    selected: boolean
  }
}

/** Placeholder rows shown while semantic results are loading. */
function ResultSkeleton() {
  return (
    <div aria-hidden {...styles.resultSkeleton()}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          key={i}
          {...styles.resultSkeleton2()}
        >
          <div {...styles.resultSkeleton3()} />
          <div {...styles.resultSkeleton4()}>
            <div {...styles.resultSkeleton5()} />
            <div {...styles.resultSkeleton6()} />
          </div>
        </div>
      ))}
    </div>
  )
}

// biome-ignore lint/correctness/noUnusedVariables: _
function JumpTo(props: JumpTo.Props) {
  const { onClick, queryTerms, result, selected } = props

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: _
    <li
      aria-selected={selected}
      className={styles.jumpTo({ className: 'vocs-group' }).className}
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link className={styles.jumpTo2().className} onClick={onClick} to={result.href}>
        <LucideArrowRight className={styles.jumpTo3().className} />
        <span {...styles.jumpTo4()}>Jump to</span>
        <span {...styles.jumpTo5()}>
          {highlightMatches(result.title, queryTerms, result.terms)}
        </span>
      </Link>
    </li>
  )
}

declare namespace JumpTo {
  type Props = {
    onClick: () => void
    queryTerms: string[]
    result: SearchResult
    selected: boolean
  }
}

function getSnippet(
  text: string,
  queryTerms: string[],
  fallbackTerms: string[],
  contextChars = 80,
): string {
  const terms = [...queryTerms, ...fallbackTerms]
  if (terms.length === 0) return text.slice(0, contextChars * 2)

  let firstMatchIndex = -1
  for (const term of terms) {
    const idx = text.toLowerCase().indexOf(term.toLowerCase())
    if (idx !== -1 && (firstMatchIndex === -1 || idx < firstMatchIndex)) {
      firstMatchIndex = idx
    }
  }

  if (firstMatchIndex === -1) return text.slice(0, contextChars * 2)

  const start = Math.max(0, firstMatchIndex - contextChars)
  const end = Math.min(text.length, firstMatchIndex + contextChars)
  const snippet = text.slice(start, end)

  return (start > 0 ? '…' : '') + snippet + (end < text.length ? '…' : '')
}

function highlightMatches(
  text: string,
  queryTerms: string[],
  fallbackTerms: string[],
): React.ReactNode {
  if (queryTerms.length === 0 && fallbackTerms.length === 0) return text

  const hasQueryMatch = queryTerms.some((term) => text.toLowerCase().includes(term.toLowerCase()))
  const terms = hasQueryMatch ? queryTerms : fallbackTerms

  if (terms.length === 0) return text

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  )
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    terms.some((term) => part.toLowerCase().includes(term.toLowerCase())) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: stable order
      <mark key={i} {...styles.highlightMatches()}>
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
