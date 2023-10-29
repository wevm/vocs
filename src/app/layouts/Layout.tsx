import type { ReactNode } from 'react'

import { Content } from '../components/Content.js'
import { ContentOnly } from './ContentOnly.js'
import * as styles from './Layout.css.js'
import { WithSidebar } from './WithSidebar.js'

export type LayoutType = 'content-only' | 'with-sidebar'

export function Layout({ children, type }: { children: ReactNode; type: LayoutType }) {
  function wrap(children: ReactNode) {
    if (type === 'with-sidebar')
      return <WithSidebar className={styles.root}>{children}</WithSidebar>
    if (type === 'content-only')
      return <ContentOnly className={styles.root}>{children}</ContentOnly>
    throw new Error('`type` not valid.')
  }

  return wrap(<Content>{children}</Content>)
}
