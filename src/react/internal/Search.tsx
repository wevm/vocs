'use client'

import { cx } from 'cva'
import { useEffect, useState } from 'react'
import LucideSearch from '~icons/lucide/search'

export function Search(props: Search.Props) {
  const { className } = props

  const [modifierKey, setModifierKey] = useState('⌘')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const apple = /(Mac|iPhone|iPod|iPad)/i.test(window.navigator.platform)
    setModifierKey(apple ? '⌘' : 'Ctrl')
  }, [])

  return (
    <button
      className={cx(
        'vocs:flex vocs:items-center vocs:justify-between vocs:cursor-pointer vocs:pl-3 vocs:pr-2 vocs:text-sm vocs:text-secondary vocs:hover:text-primary vocs:w-full vocs:h-full vocs:bg-surface vocs:hover:bg-surfaceTint vocs:border vocs:border-primary vocs:rounded-xl vocs:transition-colors vocs:duration-100',
        className,
      )}
      type="button"
    >
      <div className="vocs:flex vocs:items-center vocs:gap-2">
        <LucideSearch className="vocs:size-4" />
        Search...
      </div>
      <div className="vocs:flex vocs:items-center vocs:gap-0.5">
        <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
          {modifierKey}
        </div>{' '}
        <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
          K
        </div>
      </div>
    </button>
  )
}

export namespace Search {
  export type Props = {
    className?: string | undefined
  }
}
