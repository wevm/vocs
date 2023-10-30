import { type ClassValue, clsx } from 'clsx'
import type { ReactNode } from 'react'

import * as styles from './Step.css.js'
import { H2 } from './mdx/H2.js'
import { H3 } from './mdx/H3.js'
import { H4 } from './mdx/H4.js'
import { H5 } from './mdx/H5.js'
import { H6 } from './mdx/H6.js'

export type StepProps = {
  children: ReactNode
  className?: ClassValue
  title: ReactNode | string
  titleLevel?: 2 | 3 | 4 | 5 | 6
}

export function Step({ children, className, title, titleLevel = 2 }: StepProps) {
  const Element = (() => {
    if (titleLevel === 2) return H2
    if (titleLevel === 3) return H3
    if (titleLevel === 4) return H4
    if (titleLevel === 5) return H5
    if (titleLevel === 6) return H6
    throw new Error('Invalid.')
  })()

  return (
    <div className={clsx(className, styles.root)}>
      {typeof title === 'string' ? <Element className={styles.title}>{title}</Element> : title}
      <div className={styles.content}>{children}</div>
    </div>
  )
}
