import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'

import { useSearchIndex } from '../hooks/useSearchIndex.js'
import * as styles from './DesktopSearch.css.js'
import { SearchDialog } from './SearchDialog.js'

export function DesktopSearch() {
  useSearchIndex()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function keyDownHandler(event: KeyboardEvent) {
      const isInput =
        document.activeElement instanceof HTMLElement &&
        (['input', 'select', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) ||
          document.activeElement.isContentEditable)

      if (event.key === '/' && !open && !isInput) {
        event.preventDefault()
        setOpen(true)
      } else if (event.metaKey === true && event.key === 'k') {
        event.preventDefault()
        setOpen((x) => !x)
      }
    }

    window.addEventListener('keydown', keyDownHandler)
    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={styles.search} type="button">
          <MagnifyingGlassIcon style={{ marginTop: 2 }} />
          Search
          <div className={styles.searchCommand}>
            <div
              style={{
                background: 'currentColor',
                transform: 'rotate(45deg)',
                width: 1.5,
                borderRadius: 2,
                height: '100%',
              }}
            />
          </div>
        </button>
      </Dialog.Trigger>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </Dialog.Root>
  )
}
