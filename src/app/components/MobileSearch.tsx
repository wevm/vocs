import { useState } from 'react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Dialog from '@radix-ui/react-dialog'

import * as styles from './MobileSearch.css.js'
import { SearchDialog } from './SearchDialog.js'

export function MobileSearch() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={styles.searchButton} type="button" aria-label="Search">
          <MagnifyingGlassIcon height={21} width={21} />
        </button>
      </Dialog.Trigger>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </Dialog.Root>
  )
}
