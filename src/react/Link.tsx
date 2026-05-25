'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link as WakuLink } from 'waku'
import * as Path from '../internal/path.js'

const viewportPrefetchDelayMs = 2_000

let viewportPrefetchReady = false
let viewportPrefetchScheduled = false
const viewportPrefetchListeners = new Set<() => void>()

function markViewportPrefetchReady() {
  viewportPrefetchReady = true
  for (const listener of viewportPrefetchListeners) listener()
  viewportPrefetchListeners.clear()
}

function scheduleViewportPrefetch() {
  if (viewportPrefetchReady || viewportPrefetchScheduled || typeof window === 'undefined') return
  viewportPrefetchScheduled = true

  const scheduleAfterLoad = () => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(markViewportPrefetchReady, { timeout: 2_000 })
        return
      }
      markViewportPrefetchReady()
    }, viewportPrefetchDelayMs)
  }

  if (document.readyState === 'complete') scheduleAfterLoad()
  else window.addEventListener('load', scheduleAfterLoad, { once: true })
}

function useViewportPrefetchReady(enabled: boolean) {
  const [ready, setReady] = useState(viewportPrefetchReady)

  useEffect(() => {
    if (!enabled) return
    if (viewportPrefetchReady) {
      setReady(true)
      return
    }

    const listener = () => setReady(true)
    viewportPrefetchListeners.add(listener)
    scheduleViewportPrefetch()
    return () => {
      viewportPrefetchListeners.delete(listener)
    }
  }, [enabled])

  return enabled && ready
}

export function Link(props: Link.Props) {
  const {
    to,
    unstable_prefetchOnEnter = !import.meta.env.DEV,
    unstable_prefetchOnView = !import.meta.env.DEV,
    ...rest
  } = props
  const { path } = useRouter()
  const prefetchOnView = useViewportPrefetchReady(Boolean(unstable_prefetchOnView))

  if (Path.isExternal(props.to))
    return <a {...rest} href={props.to} rel="noopener noreferrer" target="_blank" />

  const [before, after] = (props.to || '').split('#')
  const resolvedTo = `${before ? before : path}${after ? `#${after}` : ''}`
  return (
    <WakuLink
      {...rest}
      to={resolvedTo}
      unstable_prefetchOnEnter={unstable_prefetchOnEnter}
      unstable_prefetchOnView={prefetchOnView}
    />
  )
}

export namespace Link {
  export type Props = React.ComponentProps<typeof WakuLink>
}
