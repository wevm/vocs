import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

import { useLocation } from 'react-router-dom'
import { useConfig } from '../hooks/useConfig.js'
import * as styles from './MobileSearch.css.js'
import { SearchDialog } from './SearchDialog.js'

export function MobileSearch() {
  const [open, setOpen] = useState(false)
  const config = useConfig()
  const { pathname } = useLocation()

  let pathKey = ''
  if (typeof config?.title === 'object' && Object.keys(config?.title ?? {}).length > 0) {
    let keys: string[] = []
    keys = Object.keys(config?.title).filter((key) => pathname.startsWith(key))
    pathKey = keys[keys.length - 1]
  }

  const configSearch = (config?.search as any)?.i18n?.[pathKey]

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={styles.searchButton}
          type="button"
          aria-label={configSearch?.placeholder ?? 'Search'}
        >
          <MagnifyingGlassIcon height={21} width={21} />
        </button>
      </Dialog.Trigger>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </Dialog.Root>
  )
}
