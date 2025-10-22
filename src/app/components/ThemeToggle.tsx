import { useMounted } from '../hooks/useMounted.js'
import { useTheme } from '../hooks/useTheme.js'
import { Icon } from './Icon.js'
import { Moon } from './icons/Moon.js'
import { Sun } from './icons/Sun.js'
import * as styles from './ThemeToggle.css.js'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  if (!mounted) return null
  if (!theme) return null
  return (
    <div className={styles.root}>
      <button
        data-active={theme === 'light'}
        type="button"
        className={styles.themeToggleButton}
        onClick={() => setTheme('light')}
      >
        <Icon label="Light Mode" icon={Sun} size="16px" />
      </button>
      <button
        data-active={theme === 'dark'}
        type="button"
        className={styles.themeToggleButton}
        onClick={() => setTheme('dark')}
      >
        <Icon label="Dark Mode" icon={Moon} size="16px" />
      </button>
    </div>
  )
}
