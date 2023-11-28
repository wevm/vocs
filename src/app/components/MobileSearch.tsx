import { useState } from 'react'
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Dialog from '@radix-ui/react-dialog'

import { Pagefind } from './Pagefind.js'
import * as styles from './MobileSearch.css.js'

export function MobileSearch() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className={styles.searchButton} type="button" aria-label="Search">
            <MagnifyingGlassIcon height={21} width={21} />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content aria-describedby={undefined}>
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
