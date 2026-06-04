'use client'

import * as React from 'react'

export function HeadingAnchors() {
  React.useEffect(() => {
    async function copyHeadingUrl(anchor: HTMLAnchorElement) {
      const url = anchor.href
      if (!url) return

      await navigator.clipboard.writeText(url)
      anchor.dataset['copied'] = 'true'
      window.setTimeout(() => {
        delete anchor.dataset['copied']
      }, 1000)
    }

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest<HTMLAnchorElement>('a.heading-anchor')
      if (!anchor) return

      void copyHeadingUrl(anchor).catch((error) => {
        console.error('Failed to copy heading URL:', error)
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
