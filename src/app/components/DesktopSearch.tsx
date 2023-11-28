import { useEffect, useState } from 'react'
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Dialog from '@radix-ui/react-dialog'

import { Pagefind } from './Pagefind.js'
import * as styles from './DesktopSearch.css.js'

export function DesktopSearch() {
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
    <>
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

        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent} aria-describedby={undefined}>
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close" type="button">
                <Cross2Icon />
              </button>
            </Dialog.Close>

            <Dialog.Title>Search</Dialog.Title>
            <Pagefind />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
