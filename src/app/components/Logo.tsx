import clsx from 'clsx'

import { useConfig } from '../hooks/useConfig.js'
import * as styles from './Logo.css.js'

export function Logo({ className }: { className?: string }) {
  const { logoUrl } = useConfig()

  if (!logoUrl) return null
  return (
    <>
      {typeof logoUrl === 'string' ? (
        <img alt="Logo" className={clsx(className, styles.root)} src={logoUrl} />
      ) : (
        <>
          <img
            alt="Logo"
            className={clsx(className, styles.root, styles.logoDark)}
            src={logoUrl.dark}
          />
          <img
            alt="Logo"
            className={clsx(className, styles.root, styles.logoLight)}
            src={logoUrl.light}
          />
        </>
      )}
    </>
  )
}
