import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useCallback, useEffect, useState } from 'react'

import { useQueryState } from 'nuqs'
import * as styles from './MobileSearch.css.js'
import { SearchDialog } from './SearchDialog.js'

export function MobileSearch() {
  const [open, setOpen] = useState(false)
  const [queryParam, setQueryParam] = useQueryState('q', { defaultValue: '' })
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  // Auto-open dialog when there's a query parameter (only once)
  useEffect(() => {
    if (queryParam && !open && !hasAutoOpened) {
      setOpen(true)
      setHasAutoOpened(true)
    }
  }, [queryParam, open, hasAutoOpened])

  // Auto-close dialog that was previously auto-opened once the query param is cleared
  useEffect(() => {
    if (hasAutoOpened && open && !queryParam) {
      setOpen(false)
      setHasAutoOpened(false)
    }
  }, [hasAutoOpened, open, queryParam])

  const handleClose = useCallback(() => {
    setOpen(false)
    // Only clear query parameter when closing dialog, leave localStorage alone
    if (queryParam) {
      setQueryParam(null)
    }
  }, [queryParam, setQueryParam])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={styles.searchButton} type="button" aria-label="Search">
          <MagnifyingGlassIcon height={21} width={21} />
        </button>
      </Dialog.Trigger>

      <SearchDialog open={open} onClose={handleClose} />
    </Dialog.Root>
  )
}
