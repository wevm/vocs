'use client'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import '../styles/index.css'

import { useEffect } from 'react'
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

  return children
}
