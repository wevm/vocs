'use client'

import * as React from 'react'

let theme: 'light' | 'dark' | undefined

export function DevTools() {
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        // ⌘ + 1 = color scheme toggle
        ((event.metaKey || event.ctrlKey) && event.key === '1') ||
        // ⌥ + 1 = color scheme toggle  (Safari)
        (event.altKey && event.code === 'Digit1')
      ) {
        event.preventDefault()
        theme ??= window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        document.documentElement.classList.toggle('scheme-light!', theme === 'dark')
        document.documentElement.classList.toggle('scheme-dark!', theme === 'light')
        document.documentElement.style.colorScheme = theme === 'dark' ? 'light' : 'dark'

        theme = theme === 'dark' ? 'light' : 'dark'
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return null
}
