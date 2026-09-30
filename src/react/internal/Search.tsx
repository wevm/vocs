'use client'

import { Dialog } from '@base-ui/react/dialog'
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
import { append, fuse } from '../../internal/search-fusion.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'
import { DialogTrigger } from './DialogTrigger.js'

namespace styles {
  export const trigger = style({
    height: '100% !custom',
    width: '100% !custom',
  })

  export const backdrop = style({
    position: 'fixed',
    inset: '0',
    zIndex: 100,
    backgroundColor: 'black',
    '@supports (color: color-mix(in lab, red, red))': {
      backgroundColor: `color-mix(in oklab, ${vars.color.black} 60%, transparent) !custom`,
    },
    WebkitBackdropFilter: `blur(${vars.blur.sm})        `,
    backdropFilter: `blur(${vars.blur.sm})        `,
    transitionProperty: 'opacity',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&[data-ending-style]': {
        opacity: '0%',
      },
      '&[data-starting-style]': {
        opacity: '0%',
      },
    },
  })

  export const popup = style({
    position: 'fixed',
    top: '5% !custom',
    left: 'calc(1 / 2 * 100%) !custom',
    zIndex: 101,
    display: 'flex',
    maxHeight: '70vh !custom',
    width: '90vw !custom',
    maxWidth: '600px !custom',
    transformOrigin: 'top',
    translate: 'calc(calc(1 / 2 * 100%) * -1) 0 !custom',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '2xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    boxShadow: '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 25px 50px -12px rgb(0 0 0 / 0.25)',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    '@media (width >= 40rem)': {
      top: '15% !custom',
    },
    selectors: {
      '&[data-ending-style]': {
        scale: '95% 95%',
        opacity: '0%',
      },
      '&[data-starting-style]': {
        scale: '95% 95%',
        opacity: '0%',
      },
    },
  })

  export const accessibleLabel = style({
    position: 'absolute',
    width: '1px !custom',
    height: '1px !custom',
    padding: '0 !custom',
    margin: '-1px !custom',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  })

  export const searchField = style({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: 'primary',
    paddingInline: '4',
    paddingBlock: '3',
  })

  export const searchIcon = style({
    width: '5',
    height: '5',
    flexShrink: 0,
    color: 'secondary',
  })

  export const input = style({
    flex: 1,
    backgroundColor: 'transparent !custom',
    fontSize: 'base',
    lineHeight: 'base',
    color: 'heading',
    outlineStyle: 'none',
    selectors: {
      '&::placeholder': {
        color: 'secondary',
      },
    },
  })

  export const results = style({
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '2',
  })

  export const status = style({
    fontSize: 'xs',
    lineHeight: 'xs',
    color: 'secondary',
  })

  export const loadingIcon = style({
    width: '4',
    height: '4',
    flexShrink: 0,
    animation: 'spin',
    color: 'secondary',
  })

  export const emptyState = style({
    flex: 1,
    overflowY: 'auto',
    paddingBlock: '2',
  })

  export const emptyIcon = style({
    paddingInline: '4',
    paddingBlock: '2',
    fontSize: 'xs',
    lineHeight: 'xs',
    fontWeight: 'medium',
    color: 'secondary',
  })

  export const dialogFooter = style({
    paddingInline: '4',
    paddingBlock: '8',
    textAlign: 'center',
    color: 'secondary',
  })

  export const searchHint = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: 'primary',
    paddingInline: '4',
    paddingBlock: '2',
    fontSize: 'xs',
    lineHeight: 'xs',
    color: 'secondary',
    '@media (width < 40rem)': {
      display: 'none',
    },
  })

  export const keyboardHints = style({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
  })

  export const keyboardLabel = style({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
  })

  export const key = style({
    borderRadius: '0.25rem !custom',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    paddingInline: 'oneAndHalf',
    paddingBlock: 'half',
    fontSize: '10px !custom',
  })

  export const result = style({
    cursor: 'pointer',
    paddingInline: '4',
    paddingBlock: '2',
    color: 'primary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
        },
      },
      '&[data-selected="true"]': {
        backgroundColor: 'accenta3',
        color: 'heading',
      },
    },
  })

  export const resultLink = style({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3',
  })

  export const resultIcon = style({
    marginTop: 'half',
    width: '4',
    height: '4',
    flexShrink: 0,
    color: 'secondary',
    selectors: {
      '&:is(:where(.vocs\\:group)[data-selected="true"] *)': {
        color: 'accent7',
      },
    },
  })

  export const resultContent = style({
    display: 'flex',
    minWidth: '0',
    flexDirection: 'column',
    gap: 'half',
  })

  export const resultHeading = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'xs',
    lineHeight: 'xs',
    color: 'secondary',
  })

  export const resultCategory = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 'medium',
    color: 'heading',
  })

  export const resultSnippet = style({
    overflow: 'hidden',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
  })

  export const skeleton = style({
    display: 'flex',
    flexDirection: 'column',
  })

  export const skeletonResult = style({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3',
    paddingInline: '4',
    paddingBlock: '2',
  })

  export const skeletonIcon = style({
    marginTop: 'half',
    width: '4',
    height: '4',
    flexShrink: 0,
    animation: 'pulse',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonContent = style({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 'oneAndHalf',
  })

  export const skeletonTitle = style({
    height: '3',
    width: 'calc(1 / 3 * 100%) !custom',
    animation: 'pulse',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonSnippet = style({
    height: '3',
    width: 'calc(3 / 4 * 100%) !custom',
    animation: 'pulse',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const jumpLink = style({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  })

  export const jumpIcon = style({
    marginRight: '1',
    width: '4',
    height: '4',
    flexShrink: 0,
    color: 'secondary',
    selectors: {
      '&:is(:where(.vocs\\:group)[data-selected="true"] *)': {
        color: 'accent7',
      },
    },
  })

  export const jumpLabel = style({
    color: 'secondary',
  })

  export const jumpShortcut = style({
    fontWeight: 'medium',
    color: 'heading',
  })

  export const highlight = style({
    borderRadius: 'sm',
    backgroundColor: 'accenta4',
    color: 'accent9',
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
        {...(trigger ? (className ? { className } : {}) : styles.trigger({ className }))}
        render={
          trigger ?? (
            <DialogTrigger icon={LucideSearch} triggerKey="K">
              Search...
            </DialogTrigger>
          )
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop {...styles.backdrop()} />
        <Dialog.Popup {...styles.popup()} onKeyDown={handleKeyDown}>
          <Dialog.Title {...styles.accessibleLabel()}>Search documentation</Dialog.Title>
          <Dialog.Description {...styles.accessibleLabel()}>
            Search through documentation pages. Use arrow keys to navigate, enter to select.
          </Dialog.Description>

          <div {...styles.searchField()}>
            <LucideSearch {...styles.searchIcon()} />
            <input
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={displayedResults.length > 0}
              autoComplete="off"
              // biome-ignore lint/a11y/noAutofocus: _
              autoFocus
              {...styles.input()}
              onChange={(e) => setQuery(e.target.value || null)}
              placeholder="Search..."
              role="combobox"
              spellCheck={false}
              type="text"
              value={query}
            />
            {semanticLoading && (
              <div {...styles.results()}>
                <span {...styles.status()}>Enhancing Results</span>
                <LucideLoaderCircle aria-label="Searching" {...styles.loadingIcon()} />
              </div>
            )}
          </div>

          <div {...styles.emptyState()}>
            {allItems.length > 0 ? (
              <>
                {!query.trim() && <div {...styles.emptyIcon()}>Recent searches</div>}
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
              <div {...styles.dialogFooter()}>
                {!query.trim() ? 'Start typing to search...' : 'No results found'}
              </div>
            )}
          </div>

          <div {...styles.searchHint()}>
            <div {...styles.keyboardHints()}>
              <span {...styles.keyboardLabel()}>
                <kbd {...styles.key()}>↑</kbd>
                <kbd {...styles.key()}>↓</kbd>
                <span>navigate</span>
              </span>
              <span {...styles.keyboardLabel()}>
                <kbd {...styles.key()}>↵</kbd>
                <span>select</span>
              </span>
              <span {...styles.keyboardLabel()}>
                <kbd {...styles.key()}>esc</kbd>
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
      {...styles.result({ className: 'vocs:group' })}
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link {...styles.resultLink()} onClick={onClick} to={result.href}>
        <Icon {...styles.resultIcon()} />
        <div {...styles.resultContent()}>
          {breadcrumb && <div {...styles.resultHeading()}>{breadcrumb}</div>}
          <div {...styles.resultCategory()}>
            {queryTerms.length > 0
              ? highlightMatches(result.title, queryTerms, result.terms)
              : result.title}
          </div>
          {result.text && (
            <div {...styles.resultSnippet({ className: 'vocs:line-clamp-2' })}>
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
    <div aria-hidden {...styles.skeleton()}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          key={i}
          {...styles.skeletonResult()}
        >
          <div {...styles.skeletonIcon()} />
          <div {...styles.skeletonContent()}>
            <div {...styles.skeletonTitle()} />
            <div {...styles.skeletonSnippet()} />
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
      {...styles.result({ className: 'vocs:group' })}
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link {...styles.jumpLink()} onClick={onClick} to={result.href}>
        <LucideArrowRight {...styles.jumpIcon()} />
        <span {...styles.jumpLabel()}>Jump to</span>
        <span {...styles.jumpShortcut()}>
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
      <mark key={i} {...styles.highlight()}>
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
