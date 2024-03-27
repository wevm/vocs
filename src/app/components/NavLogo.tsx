import { useLocation } from 'react-router-dom'
import { useConfig } from '../hooks/useConfig.js'
import { Logo } from './Logo.js'
import * as styles from './NavLogo.css.js'

export function NavLogo() {
  const config = useConfig()
  const { pathname } = useLocation()

  let pathKey = ''
  if (typeof config?.title === 'object' && Object.keys(config?.title ?? {}).length > 0) {
    let keys: string[] = []
    keys = Object.keys(config?.title).filter((key) => pathname.startsWith(key))
    pathKey = keys[keys.length - 1]
  }
  const configTitle = typeof config?.title === 'object' ? config?.title?.[pathKey] : config?.title

  if (config.logoUrl) return <Logo className={styles.logoImage} />
  return <div className={styles.title}>{configTitle}</div>
}
