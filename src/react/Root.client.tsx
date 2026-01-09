'use client'

import { useEffect } from 'react'
import { ErrorBoundary } from './internal/ErrorBoundary.client.js'
import { NuqsAdapter } from './internal/NuqsAdapter.js'
import { useConfig } from './useConfig.js'

export function Root_client({ children }: { children: React.ReactNode }) {
  const { accentColor, colorScheme } = useConfig()

  // react to theme config changes.
  useEffect(() => {
    if (import.meta.env.PROD) return
    const html = document.documentElement
    if (html) {
      html.style.colorScheme = colorScheme
      html.style.setProperty('--vocs-color-accent', accentColor)
    }
  }, [accentColor, colorScheme])

  return (
    <NuqsAdapter>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NuqsAdapter>
  )
}
