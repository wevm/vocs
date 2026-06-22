'use client'

import { useEffect, useState } from 'react'

export function TwoslashCompletionList(props: TwoslashCompletionList.Props) {
  const { children, className } = props
  const [list, setList] = useState<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!list) return
    const line = list.closest('.line')
    if (!(line instanceof HTMLElement)) return

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(line).lineHeight)
      const lineTop = line.getBoundingClientRect().top
      const listBottom = list.getBoundingClientRect().bottom
      const padding = Math.max(0, listBottom - lineTop - lineHeight)
      line.style.setProperty('--vocs-twoslash-popup-height', `${padding}px`)
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(list)
    return () => {
      observer.disconnect()
      line.style.removeProperty('--vocs-twoslash-popup-height')
    }
  }, [list])

  return (
    <span className={className} data-v-twoslash-completion>
      <span className="vocs:animate-blink" data-v-twoslash-completion-cursor>
        |
      </span>
      <span data-v-twoslash-completion-popup ref={setList}>
        {children}
      </span>
    </span>
  )
}

export declare namespace TwoslashCompletionList {
  export type Props = React.PropsWithChildren<React.ComponentProps<'span'>>
}
