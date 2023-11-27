import { useConfig } from '../hooks/useConfig.js'
import { Logo } from './Logo.js'
import * as styles from './NavLogo.css.js'

export function NavLogo() {
  const config = useConfig()

  if (config.logoUrl) return <Logo className={styles.logoImage} />
  return <div className={styles.title}>{config.title}</div>
}
