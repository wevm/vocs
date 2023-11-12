import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return undefined
    if (localStorage.getItem('vocs.theme')) {
      const storedTheme = localStorage.getItem('vocs.theme')
      if (storedTheme) return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (theme) localStorage.setItem('vocs.theme', theme)

    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  return {
    theme,
    toggle() {
      setTheme((theme) => (theme === 'light' ? 'dark' : 'light'))
    },
  }
}
