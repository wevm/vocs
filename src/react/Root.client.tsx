'use client'

import { useEffect } from 'react'
import { ErrorBoundary } from './internal/ErrorBoundary.client.js'
import { NuqsAdapter } from './internal/NuqsAdapter.js'
import { useConfig } from './useConfig.js'

const storageKey = 'vocs-theme'

function getStoredTheme(): 'light' | 'dark' | 'system' {
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

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const resolved = theme === 'system' ? getSystemTheme() : theme

  // Disable transitions to prevent flash
  const style = document.createElement('style')
  style.appendChild(document.createTextNode(disableTransitionsCSS))
  document.head.appendChild(style)

  document.documentElement.style.colorScheme = resolved

  // Force reflow and re-enable transitions
  ;(() => window.getComputedStyle(document.body))()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.head.removeChild(style)
    })
  })
}

export function Root_client({ children }: { children: React.ReactNode }) {
  const { accentColor, colorScheme } = useConfig()

  const staticScheme = colorScheme !== 'light dark'

  // react to theme config changes.
  useEffect(() => {
    if (import.meta.env.PROD) return
    const html = document.documentElement
    if (html) {
      html.style.setProperty('--vocs-color-accent', accentColor)
    }
  }, [accentColor])

  // Listen for system theme changes (needed for pages without ThemeToggle)
  useEffect(() => {
    if (staticScheme) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const storedTheme = getStoredTheme()
      if (storedTheme === 'system') applyTheme('system')
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [staticScheme])

  return (
    <NuqsAdapter>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NuqsAdapter>
  )
}
