'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cx } from 'cva'
import MiniSearch from 'minisearch'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideFile from '~icons/lucide/file'
import LucideHash from '~icons/lucide/hash'
import LucideSearch from '~icons/lucide/search'
import { searchFields, storeFields, tokenize } from '../../internal/search.client.js'
import { useConfig } from '../useConfig.js'
import { DialogTrigger } from './DialogTrigger.js'

const recentSearchesKey = 'vocs-recent-searches'
const maxRecentSearches = 5

type SearchResult = {
  category: string
  href: string
  id: string
  isPage: boolean
  match: Record<string, string[]>
  queryTerms: string[]
  score: number
  terms: string[]
  text: string
  title: string
  titles: string[]
}

type SearchState = {
  results: SearchResult[]
  selectedIndex: number
}

const initialSearchState: SearchState = {
  results: [],
  selectedIndex: 0,
}

export function Search(props: Search.Props) {
  const { className, disableKeyboardShortcut, trigger } = props

  const config = useConfig()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = useQueryState('q', { defaultValue: '' })
  const [search, setSearch] = React.useState<SearchState>(initialSearchState)
  const [recentSearches, setRecentSearches] = React.useState<SearchResult[]>([])
  const [index, setIndex] = React.useState<MiniSearch<SearchResult> | null>(null)

  const listRef = React.useRef<HTMLUListElement>(null)
  const router = useRouter()

  const displayedResults = query.trim() ? search.results : recentSearches

  const jumpToResult = React.useMemo(() => {
    if (!query.trim() || search.results.length === 0) return null

    const q = query.toLowerCase().trim()
    const result = search.results.find((r) => r.title.toLowerCase().startsWith(q))

    if (result?.isPage) return result
    return null
  }, [query, search.results])

  React.useEffect(() => {
    if (!open || index) return

    import('virtual:vocs/search-index')
      .then(async ({ getSearchIndex }) => {
        const json = await getSearchIndex()
        setIndex(
          MiniSearch.loadJSON<SearchResult>(json, {
            fields: [...searchFields],
            storeFields: [...storeFields],
            tokenize,
          }),
        )
      })
      .catch((error) => console.error('Failed to load search index:', error))
  }, [open, index])

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

    const results = (index.search(query, { ...config.search, tokenize }) as SearchResult[]).slice(
      0,
      20,
    )
    setSearch((s) => ({ ...s, results, selectedIndex: 0 }))
  }, [query, index, config.search])

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
            router.push(item.href)
          }
          break
        }
        case 'Escape':
          event.preventDefault()
          setOpen(false)
          break
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
        <Dialog.Backdrop className="vocs:fixed vocs:inset-0 vocs:bg-black/60 vocs:backdrop-blur-sm vocs:z-40 vocs:transition-opacity vocs:duration-150 vocs:data-starting-style:opacity-0 vocs:data-ending-style:opacity-0" />
        <Dialog.Popup
          className="vocs:fixed vocs:top-[5%] vocs:sm:top-[15%] vocs:left-1/2 vocs:-translate-x-1/2 vocs:w-[90vw] vocs:max-w-[600px] vocs:max-h-[70vh] vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-2xl vocs:shadow-2xl vocs:z-50 vocs:flex vocs:flex-col vocs:overflow-hidden vocs:transition-all vocs:duration-150 vocs:origin-top vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-95 vocs:data-ending-style:opacity-0 vocs:data-ending-style:scale-95"
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
                    return (
                      <Result
                        key={result.id}
                        queryTerms={query.trim() ? query.trim().split(/\s+/) : []}
                        onClick={() => handleResultClick(result)}
                        result={result}
                        selected={index === search.selectedIndex}
                      />
                    )
                  })}
                </ul>
              </>
            ) : (
              <div className="vocs:px-4 vocs:py-8 vocs:text-center vocs:text-secondary">
                {query.trim() ? 'No results found' : 'Start typing to search...'}
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

// biome-ignore lint/correctness/noUnusedVariables: _
function Result(props: Result.Props) {
  const { queryTerms, onClick, result, selected } = props

  const Icon = result.isPage ? LucideFile : LucideHash
  const breadcrumb = [result.category, ...result.titles].filter(Boolean).join(' › ') || null

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: _
    <li
      aria-selected={selected}
      className="vocs:group vocs:px-4 vocs:py-2 vocs:cursor-pointer vocs:transition-colors vocs:text-primary vocs:hover:bg-surfaceTint vocs:data-[selected=true]:bg-accenta3 vocs:data-[selected=true]:text-heading"
      data-selected={selected}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: _
      role="option"
    >
      <Link
        className="vocs:flex vocs:items-start vocs:gap-3"
        onClick={onClick}
        to={result.href}
        unstable_prefetchOnView
      >
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
      <Link
        className="vocs:flex vocs:items-center vocs:gap-2"
        onClick={onClick}
        to={result.href}
        unstable_prefetchOnView
      >
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
