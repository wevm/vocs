'use client'

import { cx } from 'cva'
import * as React from 'react'

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTrigger.Props>(
  function DialogTrigger(props, ref) {
    const { className, children, icon: Icon, triggerKey, ...rest } = props

    const [modifierKey, setModifierKey] = React.useState('⌘')
    React.useEffect(() => {
      if (typeof window === 'undefined') return
      const apple = /(Mac|iPhone|iPod|iPad)/i.test(window.navigator.platform)
      setModifierKey(apple ? '⌘' : 'Ctrl')
    }, [])

    return (
      <button
        ref={ref}
        className={cx(
          'vocs:flex vocs:items-center vocs:justify-between vocs:cursor-pointer vocs:pl-3 vocs:pr-2 vocs:text-sm vocs:text-secondary vocs:hover:text-primary vocs:w-full vocs:h-full vocs:bg-surface vocs:hover:bg-surfaceTint vocs:border vocs:border-primary vocs:rounded-xl vocs:transition-colors vocs:duration-100',
          className,
        )}
        type="button"
        {...rest}
      >
        <div className="vocs:flex vocs:items-center vocs:gap-2">
          {Icon && <Icon className="vocs:size-4" />}
          {children}
        </div>
        <div className="vocs:flex vocs:items-center vocs:gap-0.5">
          <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
            {modifierKey}
          </div>{' '}
          <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
            {triggerKey}
          </div>
        </div>
      </button>
    )
  },
)

export declare namespace DialogTrigger {
  export type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
    icon?: React.ElementType | undefined
    triggerKey: string
  }
}
