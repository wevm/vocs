import type { ReactNode } from 'react'

import * as styles from './Subtitle.css.js'

export function Subtitle({ children }: { children: ReactNode }) {
  return (
    <div className={styles.root} role="doc-subtitle">
      {children}
    </div>
  )
}
