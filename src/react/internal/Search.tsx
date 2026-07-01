'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cx } from 'cva'
import MiniSearch from 'minisearch'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideExternalLink from '~icons/lucide/external-link'
import LucideFile from '~icons/lucide/file'
import LucideHash from '~icons/lucide/hash'
import LucideLoaderCircle from '~icons/lucide/loader-circle'
import LucideSearch from '~icons/lucide/search'
import * as Path from '../../internal/path.js'
import { SearchConfig } from '../../internal/search.client.js'
import { fuse } from '../../internal/search-fusion.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'
import { DialogTrigger } from './DialogTrigger.js'

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
 * Public semantic-search config shape (subset). Both `config.search.rag` (a
 * built-in vector store) and `config.search.retriever` (a managed backend)
 * serialize to this shape, so the dialog treats them uniformly.
 */
type SemanticConfig = {
  enabled: boolean
  endpoint: string
  hybrid?: { enabled: boolean; semanticWeight: number; keywordWeight: number } | undefined
  /** Only present on `search.rag`; managed retrievers query at runtime. */
  runtime?: 'server' | 'client' | undefined
  ui?: { debounceMs?: number } | undefined
}

/** Result shape returned by the `/api/search/rag` and `/api/search/retrieve` endpoints. */
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

  // Hybrid semantic search. Vocs supports two semantic backends — a built-in
  // vector store (`search.rag`) and a managed retriever (`search.retriever`).
  // Both serialize to the same public shape and the same request/response
  // contract, so the dialog resolves whichever is enabled (retriever takes
  // precedence) and treats it uniformly. We fetch semantic results in the
  // background and fuse them with the instant MiniSearch keyword results into one
  // similarity-ranked list. Keyword results render immediately; the list
  // re-ranks once semantic results return, so the UI never blocks on the network.
  const searchConfig = config.search as
    | { rag?: SemanticConfig; retriever?: SemanticConfig }
    | undefined
  const retrieverConfig = searchConfig?.retriever
  const ragConfig = searchConfig?.rag
  const semanticConfig = React.useMemo<SemanticConfig | undefined>(() => {
    if (retrieverConfig?.enabled) return retrieverConfig
    // RAG only queries the server endpoint when running in server runtime.
    if (ragConfig?.enabled && ragConfig.runtime !== 'client') return ragConfig
    return undefined
  }, [retrieverConfig, ragConfig])
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

    const run = async (): Promise<void> => {
      const response = await fetch(semanticConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Semantic search failed: ${response.status}`)
      const data = (await response.json()) as { results: SemanticResult[]; indexing?: boolean }
      // The built-in RAG store builds its vector index on first use. While it's
      // still indexing we keep showing keyword results and poll until it's
      // ready, rather than blocking the request or surfacing an error. Managed
      // retrievers never set `indexing`.
      if (data.indexing) {
        retryTimer = setTimeout(() => {
          run().catch(() => {})
        }, 1500)
        return
      }
      setSemanticResults(data.results.map(toSearchResult))
      setSemanticResultsQuery(query)
      setSemanticLoading(false)
    }

    const timer = setTimeout(() => {
      setSemanticLoading(true)
      run().catch((error) => {
        if ((error as Error).name === 'AbortError') return
        setSemanticResults([])
        setSemanticLoading(false)
      })
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
    return fuse({
      keyword: search.results,
      semantic: semanticFresh,
      keywordWeight: semanticConfig?.hybrid?.keywordWeight,
      semanticWeight: semanticConfig?.hybrid?.semanticWeight,
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
        className={cx(trigger ? undefined : 'vocs:w-full vocs:h-full', className)}
        render={
          trigger ?? (
            <DialogTrigger icon={LucideSearch} triggerKey="K">
              Search...
            </DialogTrigger>
          )
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="vocs:fixed vocs:inset-0 vocs:bg-black/60 vocs:backdrop-blur-sm vocs:z-[100] vocs:transition-opacity vocs:duration-150 vocs:data-starting-style:opacity-0 vocs:data-ending-style:opacity-0" />
        <Dialog.Popup
          className="vocs:fixed vocs:top-[5%] vocs:sm:top-[15%] vocs:left-1/2 vocs:-translate-x-1/2 vocs:w-[90vw] vocs:max-w-[600px] vocs:max-h-[70vh] vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-2xl vocs:shadow-2xl vocs:z-[101] vocs:flex vocs:flex-col vocs:overflow-hidden vocs:transition-all vocs:duration-150 vocs:origin-top vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-95 vocs:data-ending-style:opacity-0 vocs:data-ending-style:scale-95"
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="vocs:sr-only">Search documentation</Dialog.Title>
          <Dialog.Description className="vocs:sr-only">
            Search through documentation pages. Use arrow keys to navigate, enter to select.
          </Dialog.Description>

          <div className="vocs:flex vocs:items-center vocs:gap-3 vocs:px-4 vocs:py-3 vocs:border-b vocs:border-primary">
            <LucideSearch className="vocs:size-5 vocs:text-secondary vocs:shrink-0" />
            <input
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={displayedResults.length > 0}
              autoComplete="off"
              // biome-ignore lint/a11y/noAutofocus: _
              autoFocus
              className="vocs:flex-1 vocs:bg-transparent vocs:text-heading vocs:placeholder:text-secondary vocs:outline-none vocs:text-base"
              onChange={(e) => setQuery(e.target.value || null)}
              placeholder="Search..."
              role="combobox"
              spellCheck={false}
              type="text"
              value={query}
            />
            {semanticLoading && (
              <LucideLoaderCircle
                aria-label="Searching"
                className="vocs:size-4 vocs:shrink-0 vocs:text-secondary vocs:animate-spin"
              />
            )}
          </div>

          <div className="vocs:flex-1 vocs:overflow-y-auto vocs:py-2">
            {allItems.length > 0 ? (
              <>
                {!query.trim() && (
                  <div className="vocs:px-4 vocs:py-2 vocs:text-xs vocs:text-secondary vocs:font-medium">
                    Recent searches
                  </div>
                )}
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
              <div className="vocs:px-4 vocs:py-8 vocs:text-center vocs:text-secondary">
                {!query.trim() ? 'Start typing to search...' : 'No results found'}
              </div>
            )}
          </div>

          <div className="vocs:max-sm:hidden vocs:flex vocs:items-center vocs:justify-between vocs:px-4 vocs:py-2 vocs:border-t vocs:border-primary vocs:text-xs vocs:text-secondary">
            <div className="vocs:flex vocs:items-center vocs:gap-3">
              <span className="vocs:flex vocs:items-center vocs:gap-1">
                <kbd className="vocs:bg-primary vocs:border vocs:border-primary vocs:rounded vocs:px-1.5 vocs:py-0.5 vocs:text-[10px]">
                  ↑
                </kbd>
                <kbd className="vocs:bg-primary vocs:border vocs:border-primary vocs:rounded vocs:px-1.5 vocs:py-0.5 vocs:text-[10px]">
                  ↓
                </kbd>
                <span>navigate</span>
              </span>
              <span className="vocs:flex vocs:items-center vocs:gap-1">
                <kbd className="vocs:bg-primary vocs:border vocs:border-primary vocs:rounded vocs:px-1.5 vocs:py-0.5 vocs:text-[10px]">
                  ↵
                </kbd>
                <span>select</span>
              </span>
              <span className="vocs:flex vocs:items-center vocs:gap-1">
                <kbd className="vocs:bg-primary vocs:border vocs:border-primary vocs:rounded vocs:px-1.5 vocs:py-0.5 vocs:text-[10px]">
                  esc
                </kbd>
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
      className="vocs:group vocs:px-4 vocs:py-2 vocs:cursor-pointer vocs:transition-colors vocs:text-primary vocs:hover:bg-surfaceTint vocs:data-[selected=true]:bg-accenta3 vocs:data-[selected=true]:text-heading"
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link className="vocs:flex vocs:items-start vocs:gap-3" onClick={onClick} to={result.href}>
        <Icon className="vocs:size-4 vocs:mt-0.5 vocs:shrink-0 vocs:text-secondary vocs:group-data-[selected=true]:text-accent7" />
        <div className="vocs:flex vocs:flex-col vocs:gap-0.5 vocs:min-w-0">
          {breadcrumb && (
            <div className="vocs:text-xs vocs:text-secondary vocs:truncate">{breadcrumb}</div>
          )}
          <div className="vocs:font-medium vocs:truncate vocs:text-heading">
            {queryTerms.length > 0
              ? highlightMatches(result.title, queryTerms, result.terms)
              : result.title}
          </div>
          {result.text && (
            <div className="vocs:text-sm vocs:text-secondary vocs:line-clamp-2">
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
    <div aria-hidden className="vocs:flex vocs:flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          key={i}
          className="vocs:flex vocs:items-start vocs:gap-3 vocs:px-4 vocs:py-2"
        >
          <div className="vocs:size-4 vocs:mt-0.5 vocs:shrink-0 vocs:rounded vocs:bg-surfaceTint vocs:animate-pulse" />
          <div className="vocs:flex vocs:flex-col vocs:gap-1.5 vocs:flex-1">
            <div className="vocs:h-3 vocs:w-1/3 vocs:rounded vocs:bg-surfaceTint vocs:animate-pulse" />
            <div className="vocs:h-3 vocs:w-3/4 vocs:rounded vocs:bg-surfaceTint vocs:animate-pulse" />
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
      className="vocs:group vocs:px-4 vocs:py-2 vocs:cursor-pointer vocs:transition-colors vocs:text-primary vocs:hover:bg-surfaceTint vocs:data-[selected=true]:bg-accenta3 vocs:data-[selected=true]:text-heading"
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link className="vocs:flex vocs:items-center vocs:gap-2" onClick={onClick} to={result.href}>
        <LucideArrowRight className="vocs:size-4 vocs:shrink-0 vocs:mr-1 vocs:text-secondary vocs:group-data-[selected=true]:text-accent7" />
        <span className="vocs:text-secondary">Jump to</span>
        <span className="vocs:text-heading vocs:font-medium">
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
      <mark key={i} className="vocs:bg-accenta4 vocs:text-accent9 vocs:rounded-sm">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
