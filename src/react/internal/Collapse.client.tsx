'use client'

import * as React from 'react'

export function CollapseHandler() {
  const containerRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const pre = containerRef.current?.closest('pre') as HTMLPreElement | null
    if (!pre) return

    const triggers = Array.from(
      pre.querySelectorAll('.line[data-v-collapse-trigger]'),
    ) as HTMLElement[]
    if (triggers.length === 0) return

    const cleanups: (() => void)[] = []

    for (const trigger of triggers) {
      const id = trigger.dataset['vCollapseTrigger']
      if (!id) continue

      const contentLines = Array.from(
        pre.querySelectorAll(`.line[data-v-collapse-content="${id}"]`),
      ) as HTMLElement[]
      if (contentLines.length === 0) continue

      const isCollapsed = trigger.hasAttribute('data-v-collapsed')

      const icon = document.createElement('span')
      icon.setAttribute('data-v-collapse-icon', '')
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`
      trigger.insertBefore(icon, trigger.firstChild)

      const applyState = (collapsed: boolean) => {
        trigger.setAttribute('data-v-collapsed', collapsed ? '' : 'false')
        for (const line of contentLines) {
          if (collapsed) {
            line.setAttribute('hidden', 'until-found')
          } else {
            line.removeAttribute('hidden')
          }
        }
      }

      applyState(isCollapsed)

      const handleClick = () => {
        const currentlyCollapsed = trigger.getAttribute('data-v-collapsed') === ''
        applyState(!currentlyCollapsed)
      }

      const handleBeforeMatch = () => {
        applyState(false)
      }

      trigger.addEventListener('click', handleClick)
      for (const line of contentLines) {
        line.addEventListener('beforematch', handleBeforeMatch)
      }
      cleanups.push(() => {
        trigger.removeEventListener('click', handleClick)
        for (const line of contentLines) {
          line.removeEventListener('beforematch', handleBeforeMatch)
        }
        icon.remove()
      })
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [])

  return <span ref={containerRef} className="vocs:hidden" />
}
