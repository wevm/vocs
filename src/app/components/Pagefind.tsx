import { useEffect } from 'react'
import '@pagefind/default-ui/css/ui.css'

import * as styles from './Pagefind.css.js'

export function Pagefind(props: { id?: string }) {
  const { id = 'vocs-search' } = props

  useEffect(() => {
    // if (import.meta.env.DEV) return

    const onIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
    onIdle(async () => {
      // @ts-ignore
      const { PagefindUI } = await import('@pagefind/default-ui')
      new PagefindUI({
        element: `#${id}`,
        baseUrl: import.meta.env.BASE_URL,
        // bundlePath: import.meta.env.BASE_URL.replace(/\/$/, '') + '/pagefind/',
        showImages: false,
        showSubResults: true,
      })
    })
  }, [id])

  return <div id={id} className={styles.root} />
}
