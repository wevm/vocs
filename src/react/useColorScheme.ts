'use client'

import * as React from 'react'

function getColorScheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  const docScheme = document.documentElement.style.colorScheme
  if (docScheme === 'light' || docScheme === 'dark') return docScheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    setColorScheme(getColorScheme())

    const observer = new MutationObserver(() => setColorScheme(getColorScheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setColorScheme(getColorScheme())
    mq.addEventListener('change', handler)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', handler)
    }
  }, [])

  return colorScheme
}
