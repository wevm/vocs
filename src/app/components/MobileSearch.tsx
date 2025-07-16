import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

import { useQueryState } from 'nuqs'
import * as styles from './MobileSearch.css.js'
import { SearchDialog } from './SearchDialog.js'

export function MobileSearch() {
  const [queryParam] = useQueryState('q', { defaultValue: '' })
  const [open, setOpen] = useState(!!queryParam)

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
