import { type ClassValue, clsx } from 'clsx'
import type { ReactNode } from 'react'

import * as styles from './Callout.css.js'
import { CheckCircle } from './icons/CheckCircle.js'
import { ExclamationTriangle } from './icons/ExclamationTriangle.js'
import { InfoCircled } from './icons/InfoCircled.js'
import { LightningBolt } from './icons/LightningBolt.js'

export type CalloutProps = {
  className: ClassValue
  children: ReactNode
  type: 'note' | 'info' | 'warning' | 'danger' | 'tip' | 'success'
}

export function Callout({ className, children, type }: CalloutProps) {
  return (
    <aside className={clsx(className, styles.root, styles[type])}>
      <div className={styles.icon}>
        {type === 'note' && <InfoCircled />}
        {type === 'info' && <InfoCircled />}
        {type === 'warning' && <ExclamationTriangle />}
        {type === 'danger' && <ExclamationTriangle />}
        {type === 'tip' && <LightningBolt />}
        {type === 'success' && <CheckCircle />}
      </div>
      <div className={styles.content}>{children}</div>
    </aside>
  )
}
