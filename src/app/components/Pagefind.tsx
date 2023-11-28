import { useEffect } from 'react'
import '@pagefind/default-ui/css/ui.css'

import * as styles from './Pagefind.css.js'

export function PageFind(props: { id?: string; isOpen: boolean; onClose(): void }) {
  const { id = '#vocs-search', isOpen } = props

  useEffect(() => {
    console.log('handler', import.meta.env.DEV)
    if (import.meta.env.DEV) return

    const onIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
    onIdle(async () => {
      // @ts-ignore
      const { PagefindUI } = await import('@pagefind/default-ui')
      new PagefindUI({
        element: id,
        baseUrl: import.meta.env.BASE_URL,
        // bundlePath: import.meta.env.BASE_URL.replace(/\/$/, '') + '/pagefind/',
        showImages: false,
        showSubResults: true,
      })
    })
  }, [id])

  return (
    <dialog className={styles.root} open={isOpen}>
      <div className="search-container">
        <div id={id} />
      </div>
    </dialog>
  )
}
