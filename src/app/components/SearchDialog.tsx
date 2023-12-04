import * as Dialog from '@radix-ui/react-dialog'
import {
  ChevronRightIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ResetIcon,
} from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type SearchResult } from 'minisearch'

import { useDebounce } from '../hooks/useDebounce.js'
import { useSearchIndex, type Result } from '../hooks/useSearchIndex.js'
import { visuallyHidden } from '../styles/utils.css.js'
import * as styles from './SearchDialog.css.js'
import clsx from 'clsx'

export function SearchDialog(props: { onClose(): void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [filterText, setFilterText] = useState('') // TODO: Persist query
  const searchTerm = useDebounce(filterText, 200)
  const searchIndex = useSearchIndex()

  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [disableMouseOver, setDisableMouseOver] = useState(false)
  const [showDetailView, setShowDetailView] = useState(true) // TODO: Persist query

  const results: (SearchResult & Result)[] = useMemo(() => {
    if (!searchTerm) return []
    return searchIndex.search(searchTerm).slice(0, 16) as (SearchResult & Result)[]
  }, [searchIndex, searchTerm])
  const resultsCount = results.length
  const selectedResult = results[selectedIndex]

  // TODO: Make sure modal is open
  useEffect(() => {
    function keyDownHandler(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          setSelectedIndex((index) => {
            const nextIndex = index + 1
            if (nextIndex >= resultsCount) return 0
            return nextIndex
          })
          setDisableMouseOver(true)
          // TODO: scroll to selected item
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          setSelectedIndex((index) => {
            const nextIndex = index - 1
            if (nextIndex < 0) return resultsCount - 1
            return nextIndex
          })
          setDisableMouseOver(true)
          // TODO: scroll to selected item
          break
        }
        case 'Enter': {
          event.preventDefault()
          if (!selectedResult) return
          navigate(selectedResult.href)
          props.onClose()
          break
        }
      }
    }

    window.addEventListener('keydown', keyDownHandler)
    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  }, [navigate, resultsCount, selectedResult, props.onClose])

  return (
    <Dialog.Portal>
      <Dialog.Overlay />

      <Dialog.Content
        onOpenAutoFocus={(event) => {
          if (inputRef.current) {
            event.preventDefault()
            inputRef.current.focus()
          }
        }}
        className={styles.root}
        aria-describedby={undefined}
      >
        <Dialog.Title className={visuallyHidden}>Search</Dialog.Title>

        <form className={styles.searchBox}>
          <MagnifyingGlassIcon className={styles.searchInputIcon} height={20} width={20} />

          <Label.Root className={visuallyHidden} htmlFor="search-input">
            Search
          </Label.Root>
          <input
            ref={inputRef}
            tabIndex={0}
            className={styles.searchInput}
            id="search-input"
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Search"
            type="search"
            value={filterText}
          />

          <button
            aria-label="Toggle detail view"
            type="button"
            onClick={() => setShowDetailView((x) => !x)}
          >
            <ListBulletIcon className={styles.searchInputIcon} height={20} width={20} />
          </button>

          <button aria-label="Reset search" type="button" onClick={() => setFilterText('')}>
            <ResetIcon className={styles.searchInputIcon} height={20} width={20} />
          </button>
        </form>

        <ul
          className={styles.results}
          role={results.length ? 'listbox' : undefined}
          onMouseMove={() => setDisableMouseOver(false)}
        >
          {searchTerm && results.length === 0 && (
            <li>
              No results for "<span>{searchTerm}</span>"
            </li>
          )}

          {results.map((result, index) => (
            <li
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole:
              role="option"
              key={result.id}
              className={clsx(styles.result, index === selectedIndex && styles.resultSelected)}
              aria-selected={index === selectedIndex}
              aria-label={[...result.titles.filter((title) => Boolean(title)), result.title].join(
                ' > ',
              )}
            >
              <Link
                to={result.href}
                onClick={() => props.onClose()}
                onMouseEnter={() => !disableMouseOver && setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
              >
                <div className={styles.titles}>
                  <span>#</span>
                  {result.titles
                    .filter((title) => Boolean(title))
                    .map((title: string) => (
                      <span className={styles.title} key={title}>
                        <span
                          // biome-ignore lint/security/noDangerouslySetInnerHtml:
                          dangerouslySetInnerHTML={{ __html: title }}
                        />
                        <ChevronRightIcon className={styles.titleIcon} />
                      </span>
                    ))}
                  <span
                    // biome-ignore lint/security/noDangerouslySetInnerHtml:
                    dangerouslySetInnerHTML={{ __html: result.title }}
                    className={styles.title}
                  />
                </div>

                {showDetailView && result.text?.trim() && (
                  <div
                    className={styles.excerpt}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml:
                    dangerouslySetInnerHTML={{ __html: result.html }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
