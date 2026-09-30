'use client'

import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import * as React from 'react'
import LucideMonitor from '~icons/lucide/monitor'
import LucideMoon from '~icons/lucide/moon'
import LucideSun from '~icons/lucide/sun'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const root = style({
    display: 'flex',
    width: 'fit-content !custom',
    alignItems: 'center',
    borderRadius: 'calc(infinity * 1px) !custom',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    padding: 'half',
  })

  export const icon = style({
    width: '4',
    height: '4',
  })

  export const option = style({
    display: 'flex',
    width: '7',
    height: '7',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px) !custom',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 60%, transparent) !custom`,
    },
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'primary',
        },
      },
      '&[data-checked]': {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'secondary',
        backgroundColor: 'surfaceMuted',
        color: 'heading',
      },
    },
  })
}

const storageKey = 'vocs-theme'

type Theme = 'light' | 'dark' | 'system'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(storageKey)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const disableTransitionsCSS =
  '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  const html = document.documentElement

  // Disable transitions to prevent flash
  const style = document.createElement('style')
  style.appendChild(document.createTextNode(disableTransitionsCSS))
  document.head.appendChild(style)

  html.setAttribute('data-vocs-theme', resolved)
  html.style.colorScheme = resolved

  // Force reflow and re-enable transitions
  ;(() => window.getComputedStyle(document.body))()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.head.removeChild(style)
    })
  })
}

export function ThemeToggle(props: ThemeToggle.Props) {
  const { className } = props
  const [theme, setTheme] = React.useState<Theme>('system')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    localStorage.setItem(storageKey, theme)
    applyTheme(theme)
  }, [theme, mounted])

  React.useEffect(() => {
    if (!mounted) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyTheme('system')
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme, mounted])

  if (!mounted) return null

  return (
    <RadioGroup
      aria-label="Theme selection"
      {...styles.root({ className })}
      onValueChange={(value) => setTheme(value as Theme)}
      value={theme}
    >
      <Option label="Light theme" value="light">
        <LucideSun {...styles.icon()} />
      </Option>

      <Option label="Dark theme" value="dark">
        <LucideMoon {...styles.icon()} />
      </Option>

      <Option label="System theme" value="system">
        <LucideMonitor {...styles.icon()} />
      </Option>
    </RadioGroup>
  )
}

export declare namespace ThemeToggle {
  export type Props = {
    className?: string | undefined
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Option(props: Option.Props) {
  const { children, label, value } = props

  return (
    <Radio.Root aria-label={label} {...styles.option()} value={value}>
      {children}
    </Radio.Root>
  )
}

declare namespace Option {
  type Props = {
    children: React.ReactNode
    label: string
    value: Theme
  }
}
