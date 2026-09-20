'use client'

import { cx } from 'cva'
import * as React from 'react'
import { style, theme } from 'zyzz/default'

namespace styles {
  export const element = style({
    display: 'flex',
    height: '100%',
    width: '100%',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingRight: 2,
    paddingLeft: 3,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.gray['100'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const element2 = style({ display: 'flex', alignItems: 'center', gap: 2 })
  export const element3 = style({ width: 4, height: 4 })
  export const element4 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 0.5)',
  })
  export const element5 = style({
    display: 'flex',
    height: 5,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 0.75)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
  })
  export const element6 = style({
    display: 'flex',
    height: 5,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 0.75)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
  })
}

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
        className={cx(styles.element().className, className)}
        type="button"
        {...rest}
      >
        <div {...styles.element2()}>
          {Icon && <Icon className={styles.element3().className} />}
          {children}
        </div>
        <div {...styles.element4()}>
          <div {...styles.element5()}>{modifierKey}</div>{' '}
          <div {...styles.element6()}>{triggerKey}</div>
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
