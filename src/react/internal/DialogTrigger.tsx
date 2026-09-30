'use client'

import * as React from 'react'
import { style } from '../../styles/zyzz.config.js'

namespace styles {
  export const button = style({
    display: 'flex',
    height: '100% !custom',
    width: '100% !custom',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingRight: '2',
    paddingLeft: '3',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '100ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          color: 'primary',
        },
      },
    },
  })

  export const label = style({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  })

  export const icon = style({
    width: '4',
    height: '4',
  })

  export const shortcut = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'half',
  })

  export const shortcutKey = style({
    display: 'flex',
    height: '5',
    width: 'auto !custom',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    paddingInline: 'threeQuarters',
    fontSize: 'xs',
    lineHeight: 'xs',
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
      <button ref={ref} {...styles.button({ className })} type="button" {...rest}>
        <div {...styles.label()}>
          {Icon && <Icon {...styles.icon()} />}
          {children}
        </div>
        <div {...styles.shortcut()}>
          <div {...styles.shortcutKey()}>{modifierKey}</div>{' '}
          <div {...styles.shortcutKey()}>{triggerKey}</div>
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
