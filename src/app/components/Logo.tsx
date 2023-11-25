import clsx from 'clsx'
import { Link } from 'react-router-dom'

import { useConfig } from '../hooks/useConfig.js'
import * as styles from './Logo.css.js'

export function Logo() {
  const config = useConfig()
  return (
    <Link to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
      {config.logoUrl ? (
        <>
          {typeof config.logoUrl === 'string' ? (
            <img alt="Logo" className={styles.logoImage} src={config.logoUrl} />
          ) : (
            <>
              <img
                alt="Logo"
                className={clsx(styles.logoImage, styles.logoDark)}
                src={config.logoUrl.dark}
              />
              <img
                alt="Logo"
                className={clsx(styles.logoImage, styles.logoLight)}
                src={config.logoUrl.light}
              />
            </>
          )}
        </>
      ) : (
        <div className={styles.title}>{config.title}</div>
      )}
    </Link>
  )
}
