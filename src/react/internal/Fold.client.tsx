'use client'

import * as React from 'react'

export function FoldHandler() {
  const containerRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const pre = containerRef.current?.closest('pre') as HTMLPreElement | null
    if (!pre) return

    const foldSpans = Array.from(pre.querySelectorAll('[data-v-fold]')) as HTMLElement[]
    if (foldSpans.length === 0) return

    const cleanups: (() => void)[] = []

    for (const span of foldSpans) {
      const originalContent = span.innerHTML
      const originalText = span.textContent || ''

      const button = document.createElement('button')
      button.setAttribute('data-v-fold-button', '')
      button.setAttribute('aria-label', 'Expand folded code')
      button.setAttribute('title', originalText)
      button.textContent = '...'
      button.type = 'button'

      span.innerHTML = ''
      span.appendChild(button)
      span.setAttribute('data-v-folded', '')

      const handleClick = (e: Event) => {
        e.stopPropagation()
        const isFolded = span.hasAttribute('data-v-folded')
        if (isFolded) {
          span.innerHTML = originalContent
          span.removeAttribute('data-v-folded')
        } else {
          span.innerHTML = ''
          span.appendChild(button)
          span.setAttribute('data-v-folded', '')
        }
      }

      button.addEventListener('click', handleClick)
      cleanups.push(() => {
        button.removeEventListener('click', handleClick)
      })
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [])

  return <span ref={containerRef} className="vocs:hidden" />
}
