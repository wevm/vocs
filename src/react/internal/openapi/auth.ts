import type { IrSecurityScheme } from '../../../internal/openapi/parser.js'

/**
 * Client-side persistence for the OpenAPI playground's global authentication.
 *
 * The {@link file://./Authentication.client.tsx authentication panel} writes a
 * single API key here (keyed per spec mount) and the
 * {@link file://./Playground.client.tsx playground provider} reads it back to
 * seed Scalar's API client, so a key entered once applies to every "Try"
 * request across the section — including on pages (Introduction/overview) that
 * never mount the playground modal themselves.
 *
 * We are intentionally opinionated: a single token is captured and sent as a
 * bearer credential (falling back to an apiKey scheme when the spec has no
 * bearer scheme). The value lives in `localStorage` so it survives reloads, and
 * everything is guarded for SSR (no `window`) and degrades to a no-op when
 * storage is unavailable (private mode, blocked cookies).
 */

const prefix = 'vocs:openapi-auth:'
const eventName = 'vocs:openapi-auth-change'

function storageKey(mount: string) {
  return prefix + (mount || '/')
}

/**
 * The security scheme the global API key applies to. Opinionated preference:
 * an `http` `bearer` scheme first, then an `apiKey` scheme, then any other
 * single-token `http` scheme. Returns `null` when the spec has no scheme we can
 * drive with a single token (e.g. only `oauth2`/`openIdConnect`).
 */
export function primaryScheme(
  schemes: Record<string, IrSecurityScheme> | undefined,
): { name: string; scheme: IrSecurityScheme } | null {
  const entries = Object.entries(schemes ?? {})
  const isHttp = (scheme: IrSecurityScheme, want: string) =>
    scheme.type === 'http' &&
    String((scheme as { scheme?: string }).scheme ?? '').toLowerCase() === want
  const bearer = entries.find(([, scheme]) => isHttp(scheme, 'bearer'))
  if (bearer) return { name: bearer[0], scheme: bearer[1] }
  const apiKey = entries.find(([, scheme]) => scheme.type === 'apiKey')
  if (apiKey) return { name: apiKey[0], scheme: apiKey[1] }
  const http = entries.find(([, scheme]) => scheme.type === 'http')
  if (http) return { name: http[0], scheme: http[1] }
  return null
}

/** Read the persisted API key for a mount (empty string when none/SSR). */
export function read(mount: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(storageKey(mount)) ?? ''
  } catch {
    return ''
  }
}

/** Persist the API key for a mount and notify listeners (this tab + others). */
export function write(mount: string, token: string): void {
  if (typeof window === 'undefined') return
  try {
    if (token) window.localStorage.setItem(storageKey(mount), token)
    else window.localStorage.removeItem(storageKey(mount))
  } catch {}
  // `storage` events only fire in *other* tabs, so dispatch our own for the
  // current document (the panel and the playground provider both listen).
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { mount } }))
  } catch {}
}

/**
 * Subscribe to API key changes for a mount. Fires on same-tab writes (via the
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
