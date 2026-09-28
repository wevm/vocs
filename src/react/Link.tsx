'use client'

import { useContext, useEffect, useState } from 'react'
import { Link as WakuLink } from 'waku'
import { RouterHostContext_UNSTABLE as WakuRouterContext } from 'waku/router/client-core'
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
  const { to, unstable_prefetchOnEnter = {}, unstable_prefetchOnView = {}, ...rest } = props
  const router = useContext(WakuRouterContext)
  const routerPath = router?.route.path
  const isExternal = Path.isExternal(props.to)
  const prefetchOnView = unstable_prefetchOnView || undefined
  const prefetchOnViewReady = useViewportPrefetchReady(
    Boolean(prefetchOnView) && !isExternal && routerPath !== undefined,
  )

  if (isExternal) return <a {...rest} href={props.to} rel="noopener noreferrer" target="_blank" />

  const [before, after] = (props.to || '').split('#')
  const resolvedTo = `${before ? before : (routerPath ?? '')}${after ? `#${after}` : ''}`
  if (routerPath === undefined) return <a {...rest} href={resolvedTo || props.to} />
  return (
    <WakuLink
      {...rest}
      to={resolvedTo}
      unstable_prefetchOnEnter={unstable_prefetchOnEnter}
      {...(prefetchOnViewReady && prefetchOnView
        ? { unstable_prefetchOnView: prefetchOnView }
        : {})}
    />
  )
}

export namespace Link {
  export type Props = Omit<
    React.ComponentProps<typeof WakuLink>,
    'to' | 'unstable_prefetchOnView'
  > & {
    to: string
    unstable_prefetchOnView?:
      | React.ComponentProps<typeof WakuLink>['unstable_prefetchOnView']
      | false
  }
}
