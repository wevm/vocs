'use client'

/**
 * Minimal `waku` replacement for the prebuilt OpenAPI app.
 *
 * The real Vocs layout/chrome (`Layout`, `Sidebar`, `TopNav`, `Outline`,
 * `Search`, `Pagination`, `Link`, …) only touch Waku through `useRouter()` and
 * `Link`. The standalone build aliases `waku` to this module so those genuine
 * components render in a plain client SPA — no RSC, no Waku runtime — driven by
 * a history-backed router instead.
 *
 * Routing operates in "section space": `useRouter().path` is the spec-relative
 * route (mount prefix stripped) so sidebar active-state and `Link` resolution
 * work regardless of where the host server mounts the app. {@link Link} and the
 * delegated click handler translate back to real, mount-prefixed URLs.
 */

import * as React from 'react'
import type { Payload } from '../internal/openapi/app.js'
import { createRouter, type Router } from './links.js'

type Snapshot = { path: string; hash: string }

let router: Router | undefined
let snapshot: Snapshot = { path: '/', hash: '' }

const listeners = new Set<() => void>()
const eventHandlers: Record<string, Set<() => void>> = {}

function notify() {
  for (const listener of listeners) listener()
}

function emit(type: string) {
  for (const handler of eventHandlers[type] ?? []) handler()
}

const events = {
  on(type: string, handler: () => void) {
    let set = eventHandlers[type]
    if (!set) {
      set = new Set()
      eventHandlers[type] = set
    }
    set.add(handler)
  },
  off(type: string, handler: () => void) {
    eventHandlers[type]?.delete(handler)
  },
}

function setSnapshot(path: string, hash: string) {
  snapshot = { path, hash }
  notify()
}

/** Navigates to a section-space route, updating history + router state. */
function push(to: string, options: { push?: boolean } = {}) {
  if (!router) return
  emit('start')
  const url = new URL(router.href(to), window.location.origin)
  if (options.push !== false) window.history.pushState(null, '', url.pathname + url.hash)
  const { route } = router.resolve(url.pathname)
  setSnapshot(route, url.hash)
}

/** Delegated handler that routes internal anchor clicks through the SPA. */
function onClick(event: MouseEvent) {
  if (!router) return
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return
  if (event.button !== 0) return
  const target = event.target as Element | null
  const anchor = target?.closest<HTMLAnchorElement>('a[href]')
  if (!anchor || anchor.target === '_blank') return
  if (anchor.classList.contains('heading-anchor')) return // copy-link, handled elsewhere

  const url = new URL(anchor.href, window.location.origin)
  if (url.origin !== window.location.origin) return

  // In-page hash link (same route) → let the browser/anchor logic scroll.
  if (url.pathname === window.location.pathname && url.hash) return

  // Only intercept links that live under our mount.
  const mount = router.mount
  if (mount && !url.pathname.startsWith(mount)) return

  event.preventDefault()
  emit('start')
  window.history.pushState(null, '', url.pathname + url.hash)
  const { route } = router.resolve(url.pathname)
  setSnapshot(route, url.hash)
}

/**
 * Initializes the router from the payload + current location. Call once before
 * rendering the app.
 */
export function init(payload: Payload) {
  router = createRouter(payload, window.location.pathname)
  const { route } = router.resolve(window.location.pathname)
  snapshot = { path: route, hash: window.location.hash }

  window.addEventListener('popstate', () => {
    if (!router) return
    const { route } = router.resolve(window.location.pathname)
    setSnapshot(route, window.location.hash)
  })
  document.addEventListener('click', onClick)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return snapshot
}

/** Waku-compatible `useRouter()`. Returns section-space `path`/`hash`. */
export function useRouter() {
  const snap = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    path: snap.path,
    hash: snap.hash,
    push: (to: string) => push(to),
    replace: (to: string) => push(to, { push: false }),
    unstable_events: events,
  }
}

/** Waku-compatible `Link`. Renders a real, mount-prefixed `<a>`. */
export function Link(props: Link.Props) {
  const {
    to = '',
    unstable_prefetchOnEnter: _enter,
    unstable_prefetchOnView: _view,
    ...rest
  } = props
  // Resolve a bare in-page hash (`#id`, e.g. from the outline) against the
  // current section route so it targets this page, not the section root.
  const { path } = useRouter()
  const target = to.startsWith('#') ? `${path}${to}` : to
  const href = router ? router.href(target) : target
  return <a {...rest} href={href} />
}

export declare namespace Link {
  type Props = {
    to?: string | undefined
    unstable_prefetchOnEnter?: boolean | undefined
    unstable_prefetchOnView?: boolean | undefined
  } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
}
