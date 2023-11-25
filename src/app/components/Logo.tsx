import clsx from 'clsx'

import { useConfig } from '../hooks/useConfig.js'
import * as styles from './Logo.css.js'

export function Logo() {
  const config = useConfig()

  if (config.logoUrl)
    return (
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
    )

  return <div className={styles.title}>{config.title}</div>
}
