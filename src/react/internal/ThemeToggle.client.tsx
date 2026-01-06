'use client'

import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { cx } from 'cva'
import * as React from 'react'
import LucideMonitor from '~icons/lucide/monitor'
import LucideMoon from '~icons/lucide/moon'
import LucideSun from '~icons/lucide/sun'

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

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.style.colorScheme = resolved
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
      className={cx(
        'vocs:flex vocs:w-fit vocs:items-center vocs:p-0.5 vocs:rounded-full vocs:bg-surface vocs:border vocs:border-primary',
        className,
      )}
      onValueChange={(value) => setTheme(value as Theme)}
      value={theme}
    >
      <Option label="Light theme" value="light">
        <LucideSun className="vocs:size-4" />
      </Option>

      <Option label="Dark theme" value="dark">
        <LucideMoon className="vocs:size-4" />
      </Option>

      <Option label="System theme" value="system">
        <LucideMonitor className="vocs:size-4" />
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
    <Radio.Root
      aria-label={label}
      className="vocs:flex vocs:items-center vocs:justify-center vocs:size-7 vocs:rounded-full vocs:cursor-pointer vocs:transition-all vocs:duration-150 vocs:text-primary/60 vocs:hover:text-primary vocs:data-checked:bg-surfaceMuted vocs:data-checked:text-heading vocs:data-checked:border vocs:data-checked:border-secondary"
      value={value}
    >
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
