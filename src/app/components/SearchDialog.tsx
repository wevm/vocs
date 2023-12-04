import * as Dialog from '@radix-ui/react-dialog'
import {
  ChevronRightIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ResetIcon,
} from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import { type SearchResult } from 'minisearch'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useDebounce } from '../hooks/useDebounce.js'
import { type Result, useSearchIndex } from '../hooks/useSearchIndex.js'
import { visuallyHidden } from '../styles/utils.css.js'
import * as styles from './SearchDialog.css.js'

export function SearchDialog(props: { onClose(): void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  // TODO: Persist query
  const [filterText, setFilterText] = useState('')
  const searchTerm = useDebounce(filterText, 200)
  const searchIndex = useSearchIndex()

  const results: (SearchResult & Result)[] = useMemo(() => {
    if (!searchTerm) return []
    return searchIndex.search(searchTerm).slice(0, 16) as (SearchResult & Result)[]
  }, [searchIndex, searchTerm])

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

          <button aria-label="Toggle list view" type="button">
            <ListBulletIcon className={styles.searchInputIcon} height={20} width={20} />
          </button>
          <button aria-label="Reset search" type="button">
            <ResetIcon className={styles.searchInputIcon} height={20} width={20} />
          </button>
        </form>

        <ul className={styles.results}>
          {searchTerm && results.length === 0 && (
            <li>
              No results for "<span>{searchTerm}</span>"
            </li>
          )}
          {results.map((result) => (
            <li key={result.id} className={styles.result}>
              <Link to={result.href} onClick={() => props.onClose()}>
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
              </Link>
            </li>
          ))}
        </ul>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
