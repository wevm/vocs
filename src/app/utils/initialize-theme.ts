const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const storedTheme = localStorage.getItem('vocs.theme')
const theme = storedTheme || 'dark'

if (theme === 'dark') document.documentElement.classList.add('dark')

if (!storedTheme)
  // Update the theme if the user changes their OS preference
  darkModeMediaQuery.addEventListener('change', ({ matches: isDark }) => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  })
