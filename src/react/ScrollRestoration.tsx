'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'waku'

const storageKey = 'vocs:scroll'

export function ScrollRestoration() {
  const router = useRouter()
  const { path, unstable_events: events } = router

  const savedPositions = useRef<Record<string, number>>({})
  const prevPath = useRef<string | null>(null)
  const isPopstate = useRef(false)

  // Load saved positions and listen to router events
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.history.scrollRestoration = 'manual'

    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored) savedPositions.current = JSON.parse(stored)
    } catch {}

    // Track back/forward navigation
    function handlePopstate() {
      isPopstate.current = true
    }

    // Save scroll position before navigation starts
    function handleNavigateStart() {
      if (prevPath.current !== null) {
        savedPositions.current[prevPath.current] = window.scrollY
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(savedPositions.current))
        } catch {}
      }
    }

    window.addEventListener('popstate', handlePopstate)
    events.on('start', handleNavigateStart)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
      events.off('start', handleNavigateStart)
      window.history.scrollRestoration = 'auto'
    }
  }, [events])

  // Handle scroll on path change
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Handle hash scrolling
    const hash = window.location.hash.slice(1)
    if (hash) {
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView()
        prevPath.current = path
        return
      }
    }

    // Restore saved position only on back/forward, otherwise scroll to top
    if (isPopstate.current) {
      const savedY = savedPositions.current[path]
      if (typeof savedY === 'number') window.scrollTo(0, savedY)
      else window.scrollTo(0, 0)
      isPopstate.current = false
    } else {
      window.scrollTo(0, 0)
    }

    prevPath.current = path
  }, [path])

  return null
}
