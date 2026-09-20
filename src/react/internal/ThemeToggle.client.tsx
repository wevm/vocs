'use client'

import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { cx } from 'cva'
import * as React from 'react'
import { style, theme } from 'zyzz/default'
import LucideMonitor from '~icons/lucide/monitor'
import LucideMoon from '~icons/lucide/moon'
import LucideSun from '~icons/lucide/sun'

namespace styles {
  export const themeToggle = style({
    display: 'flex',
    width: 'fit-content',
    alignItems: 'center',
    borderRadius: 'calc(infinity * 1px)',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    padding: 'calc(0.25rem * 0.5)',
  })
  export const themeToggle2 = style({ width: 4, height: 4 })
  export const themeToggle3 = style({ width: 4, height: 4 })
  export const themeToggle4 = style({ width: 4, height: 4 })
  export const option = style({
    display: 'flex',
    width: 7,
    height: 7,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 60%, transparent)`,
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-checked]': {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: theme.vars.color.gray['300'],
        backgroundColor: theme.vars.color.gray['100'],
        color: theme.vars.color.foreground,
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
      className={cx(styles.themeToggle().className, className)}
      onValueChange={(value) => setTheme(value as Theme)}
      value={theme}
    >
      <Option label="Light theme" value="light">
        <LucideSun className={styles.themeToggle2().className} />
      </Option>

      <Option label="Dark theme" value="dark">
        <LucideMoon className={styles.themeToggle3().className} />
      </Option>

      <Option label="System theme" value="system">
        <LucideMonitor className={styles.themeToggle4().className} />
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
    <Radio.Root aria-label={label} className={styles.option().className} value={value}>
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
