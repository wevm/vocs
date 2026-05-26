'use client'

import * as React from 'react'

export type ScrollDirection = 'up' | 'down' | null

const maxWidth = 748

export function useScrollDirection(options: useScrollDirection.Options = {}): ScrollDirection {
  const { deltaY = 0, threshold = 10 } = options

  const [direction, setDirection] = React.useState<ScrollDirection>(null)
  const lastScrollY = React.useRef(0)
  const lastDirectionChangeY = React.useRef(0)
  const ticking = React.useRef(false)

  React.useEffect(() => {
    if (window.innerWidth > maxWidth) return

    lastScrollY.current = window.scrollY
    lastDirectionChangeY.current = window.scrollY

    const updateDirection = () => {
      const scrollY = window.scrollY
      const diff = scrollY - lastScrollY.current

      if (Math.abs(diff) < threshold) {
        ticking.current = false
        return
      }

      const newDirection = diff > 0 ? 'down' : 'up'
      const delta = scrollY - lastDirectionChangeY.current

      if (newDirection === 'down' && delta < deltaY) {
        lastScrollY.current = scrollY
        ticking.current = false
        return
      }

      setDirection(newDirection)
      lastDirectionChangeY.current = scrollY
      lastScrollY.current = scrollY
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(updateDirection)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, deltaY])

  return direction
}

export declare namespace useScrollDirection {
  export type Options = {
    deltaY?: number | undefined
    threshold?: number | undefined
  }
}
