import { useTheme } from '../hooks/useTheme.js'
import * as styles from './DesktopTopNav.css.js'
import { Icon } from './Icon.js'

DesktopTopNav.Curtain = Curtain

export function DesktopTopNav() {
  const { toggle, theme } = useTheme()
  return (
    <div className={styles.root}>
      <div className={styles.section} />
      <div className={styles.section}>
        <div className={styles.item}>
          <button className={styles.button} onClick={toggle} type="button">
            {theme === 'dark' ? (
              <Icon size="18px" label="Light" src="/.vocs/icons/sun.svg" />
            ) : (
              <Icon size="18px" label="Dark" src="/.vocs/icons/moon.svg" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Curtain() {
  return <div className={styles.curtain} />
}
