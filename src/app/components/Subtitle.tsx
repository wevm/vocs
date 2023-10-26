import type { ReactNode } from 'react'

import styles from './Subtitle.module.css'

export function Subtitle({ children }: { children: ReactNode }) {
  return (
    <div className={styles.root} role="doc-subtitle">
      {children}
    </div>
  )
}
