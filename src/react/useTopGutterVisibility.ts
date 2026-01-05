import * as React from 'react'

export const maxWidth = 748
export const lerpFactor = 0.5

export function lerp(current: number, target: number): number {
  return current + (target - current) * lerpFactor
}

export function useTopGutterVisibility(maxOffset: number): React.RefCallback<HTMLElement> {
  const state = React.useRef({
    animating: false,
    cleanup: null as (() => void) | null,
    currentOffset: 0,
    lastScrollY: 0,
    targetOffset: 0,
  })

  return React.useCallback(
    (element: HTMLElement | null) => {
      // Cleanup previous listener
      state.current.cleanup?.()
      state.current.cleanup = null

      if (!element) return
      if (window.innerWidth > maxWidth) return

      element.style.willChange = 'transform, opacity'

      const s = state.current
      s.lastScrollY = window.scrollY
      s.targetOffset = 0
      s.currentOffset = 0
      s.animating = false

      const animate = () => {
        s.currentOffset = lerp(s.currentOffset, s.targetOffset)

        if (Math.abs(s.currentOffset - s.targetOffset) < 0.5) {
          s.currentOffset = s.targetOffset
          s.animating = false
        } else {
          requestAnimationFrame(animate)
        }

        const opacity = 1 - s.currentOffset / maxOffset
        element.style.cssText = `
          will-change: transform, opacity;
          transform: translate3d(0, -${s.currentOffset}px, 0);
          opacity: ${opacity};
          visibility: ${opacity < 0.1 ? 'hidden' : 'visible'};
        `
      }

      const onScroll = () => {
        const scrollY = window.scrollY

        if (scrollY < 0) {
          s.lastScrollY = 0
          return
        }

        const diff = scrollY - s.lastScrollY
        s.lastScrollY = scrollY

        if (diff === 0) return

        s.targetOffset = Math.max(0, Math.min(s.targetOffset + diff, maxOffset))

        if (!s.animating) {
          s.animating = true
          requestAnimationFrame(animate)
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      s.cleanup = () => window.removeEventListener('scroll', onScroll)
    },
    [maxOffset],
  )
}
