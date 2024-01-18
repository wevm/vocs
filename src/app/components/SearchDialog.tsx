import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FileIcon,
} from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import clsx from 'clsx'
import { default as Mark } from 'mark.js'
import { type SearchResult } from 'minisearch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useDebounce } from '../hooks/useDebounce.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { type Result, useSearchIndex } from '../hooks/useSearchIndex.js'
import { visuallyHidden } from '../styles/utils.css.js'
import { Content } from './Content.js'
import { KeyboardShortcut } from './KeyboardShortcut.js'
import * as styles from './SearchDialog.css.js'

export function SearchDialog(props: { open: boolean; onClose(): void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [filterText, setFilterText] = useLocalStorage('filterText', '')
  const searchTerm = useDebounce(filterText, 200)
  const searchIndex = useSearchIndex()

  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [disableMouseOver, setDisableMouseOver] = useState(false)
  const [showDetailView, setShowDetailView] = useLocalStorage('showDetailView', true)

  const results: (SearchResult & Result)[] = useMemo(() => {
    if (!searchIndex) return []
    if (!searchTerm) {
      setSelectedIndex(-1)
      return []
    }
    setSelectedIndex(0)
    return searchIndex.search(searchTerm).slice(0, 16) as (SearchResult & Result)[]
  }, [searchIndex, searchTerm])

  const resultsCount = results.length
  const selectedResult = results[selectedIndex]

  const highlight = useCallback(() => {
    if (!listRef.current) return

    const terms = new Set<string>()
    for (const result of results) {
      for (const term in result.match) {
        terms.add(term)
      }
    }

    const mark = new Mark(listRef.current)
    mark.unmark({
      done() {
        mark?.markRegExp(formMarkRegex(terms))
      },
    })

    const excerptElements = listRef.current.querySelectorAll(`.${styles.excerpt}`)
    for (const element of excerptElements) {
      element.querySelector('mark[data-markjs="true"]')?.scrollIntoView({ block: 'center' })
    }
    listRef.current?.firstElementChild?.scrollIntoView({ block: 'start' })
  }, [results])

  useEffect(() => {
    if (!props.open) return

    function keyDownHandler(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          setSelectedIndex((index) => {
            let nextIndex = index + 1
            if (nextIndex >= resultsCount) nextIndex = 0
            const element = listRef.current?.children[nextIndex]
            element?.scrollIntoView({ block: 'nearest' })
            return nextIndex
          })
          setDisableMouseOver(true)
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          setSelectedIndex((index) => {
            let nextIndex = index - 1
            if (nextIndex < 0) nextIndex = resultsCount - 1
            const element = listRef.current?.children[nextIndex]
            element?.scrollIntoView({ block: 'nearest' })
            return nextIndex
          })
          setDisableMouseOver(true)
          break
        }
        case 'Backspace': {
          if (!event.metaKey) return
          event.preventDefault()
          setFilterText('')
          inputRef.current?.focus()
          break
        }
        case 'Enter': {
          if (event.target instanceof HTMLButtonElement && event.target.type !== 'submit') return
          if (!selectedResult) return
          event.preventDefault()
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
  }, [navigate, resultsCount, setFilterText, selectedResult, props.open, props.onClose])

  useEffect(() => {
    if (searchTerm === '') return
    if (!listRef.current) return
    highlight()
  }, [highlight, searchTerm])

  return (
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />

      <Dialog.Content
        onOpenAutoFocus={(event) => {
          if (inputRef.current) {
            event.preventDefault()
            inputRef.current.focus()
          }
          highlight()
        }}
        onCloseAutoFocus={() => {
          setSelectedIndex(0)
        }}
        className={styles.root}
        aria-describedby={undefined}
      >
        <Dialog.Title className={visuallyHidden}>Search</Dialog.Title>

        <form className={styles.searchBox}>
          <button
            aria-label="Close search dialog"
            type="button"
            onClick={() => props.onClose()}
            className={styles.searchInputIconMobile}
          >
            <ArrowLeftIcon className={styles.searchInputIcon} height={20} width={20} />
          </button>

          <Label.Root htmlFor="search-input">
            <MagnifyingGlassIcon
              aria-label="Search"
              className={clsx(styles.searchInputIcon, styles.searchInputIconDesktop)}
              height={20}
              width={20}
            />
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

          <button
            aria-label="Reset search"
            type="button"
            className={styles.searchInputIcon}
            onClick={() => {
              setFilterText('')
              inputRef.current?.focus()
            }}
          >
            ⌫
          </button>
        </form>

        <ul
          className={styles.results}
          role={results.length ? 'listbox' : undefined}
          onMouseMove={() => setDisableMouseOver(false)}
          ref={listRef}
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
                onClick={(event) => {
                  // Don't close the dialog if the user is opening the link in a new tab.
                  if (event.metaKey) return
                  props.onClose()
                }}
                onMouseEnter={() => !disableMouseOver && setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
              >
                <div className={styles.titles}>
                  {result.isPage ? (
                    <FileIcon className={styles.resultIcon} />
                  ) : (
                    <span className={styles.resultIcon}>#</span>
                  )}
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
                  <span className={styles.title}>
                    <span
                      // biome-ignore lint/security/noDangerouslySetInnerHtml:
                      dangerouslySetInnerHTML={{ __html: result.title }}
                    />
                  </span>
                </div>

                {showDetailView && result.text?.trim() && (
                  <div className={styles.excerpt}>
                    <Content className={styles.content}>
                      <div
                        // biome-ignore lint/security/noDangerouslySetInnerHtml:
                        dangerouslySetInnerHTML={{ __html: result.html }}
                      />
                    </Content>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.searchShortcuts}>
          <KeyboardShortcut description="Navigate" keys={['↑', '↓']} />
          <KeyboardShortcut description="Select" keys={['enter']} />
          <KeyboardShortcut description="Close" keys={['esc']} />
          <KeyboardShortcut description="Reset" keys={['⌘', '⌫']} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function formMarkRegex(terms: Set<string>) {
  return new RegExp(
    [...terms]
      .sort((a, b) => b.length - a.length)
      .map((term) => {
        return `(${term.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')})`
      })
      .join('|'),
    'gi',
  )
}
