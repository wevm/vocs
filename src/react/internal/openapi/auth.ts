/**
 * Client-side persistence for the OpenAPI playground's authentication.
 *
 * The source of truth is Scalar's own auth UI inside the "Try" modal: whenever
 * the consumer edits credentials there, the
 * {@link file://./Playground.client.tsx playground provider} captures Scalar's
 * exported auth state and persists it here (keyed per spec mount). Every other
 * playground instance — on other pages of the same section, or after a reload —
 * reads it back and loads it into its Scalar store, so a credential entered once
 * in any "Try" applies everywhere.
 *
 * The persisted value is an opaque JSON string (Scalar's `auth.export()` /
 * `auth.load()` shape); we never interpret it. The value lives in
 * `localStorage` so it survives reloads, and everything is guarded for SSR (no
 * `window`) and degrades to a no-op when storage is unavailable (private mode,
 * blocked cookies).
 */

const prefix = 'vocs:openapi-auth:'
const eventName = 'vocs:openapi-auth-change'

function storageKey(mount: string) {
  return prefix + (mount || '/')
}

/** Read the persisted auth blob for a mount (`null` when none/SSR). */
export function read(mount: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(storageKey(mount))
  } catch {
    return null
  }
}

/** Persist the auth blob for a mount and notify listeners (this tab + others). */
export function write(mount: string, value: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value) window.localStorage.setItem(storageKey(mount), value)
    else window.localStorage.removeItem(storageKey(mount))
  } catch {}
  // `storage` events only fire in *other* tabs, so dispatch our own for the
  // current document (other playground instances on the page listen for it).
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { mount } }))
  } catch {}
}

/**
 * Subscribe to auth changes for a mount. Fires on same-tab writes (via the
 * custom event) and cross-tab writes (via the native `storage` event). Returns
 * an unsubscribe function.
 */
export function subscribe(mount: string, callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onCustom = (event: Event) => {
    if ((event as CustomEvent<{ mount?: string }>).detail?.mount === mount) callback()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(mount)) callback()
  }
  window.addEventListener(eventName, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(eventName, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}
