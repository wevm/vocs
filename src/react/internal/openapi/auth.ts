import type { IrSecurityScheme } from '../../../internal/openapi/parser.js'

/**
 * Client-side persistence for the OpenAPI playground's global authentication.
 *
 * The {@link file://./Authentication.client.tsx authentication panel} writes the
 * consumer's credentials here (keyed per spec mount) and the
 * {@link file://./Playground.client.tsx playground provider} reads them back to
 * seed Scalar's API client, so a token entered once applies to every "Try"
 * request across the section — including on pages (Introduction/overview) that
 * never mount the playground modal themselves.
 *
 * Values live in `localStorage` so they survive reloads. Everything is guarded
 * for SSR (no `window`) and degrades to an in-memory no-op when storage is
 * unavailable (private mode, blocked cookies).
 */

/** Per-scheme credentials the consumer has entered. */
export type AuthValue = {
  /** Bearer token / API key (apiKey + http `bearer`). */
  token?: string | undefined
  /** Username (http `basic`). */
  username?: string | undefined
  /** Password (http `basic`). */
  password?: string | undefined
}

/** All credentials for a single spec mount, keyed by security scheme name. */
export type AuthValues = Record<string, AuthValue>

/** Auth "kind" we surface a field set for. Other types are ignored. */
export type AuthKind = 'token' | 'basic'

const prefix = 'vocs:openapi-auth:'
const eventName = 'vocs:openapi-auth-change'

function storageKey(mount: string) {
  return prefix + (mount || '/')
}

/** Classify a security scheme into the field set we render, or `null` to skip. */
export function authKind(scheme: IrSecurityScheme): AuthKind | null {
  if (scheme.type === 'apiKey') return 'token'
  if (scheme.type === 'http') {
    const httpScheme = String((scheme as { scheme?: string }).scheme ?? '').toLowerCase()
    if (httpScheme === 'basic') return 'basic'
    // `bearer` (and any other single-token http scheme) → token field.
    return 'token'
  }
  // oauth2 / openIdConnect are not supported by the simple global panel.
  return null
}

/** Read persisted credentials for a mount (empty object when none/SSR). */
export function read(mount: string): AuthValues {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey(mount))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as AuthValues) : {}
  } catch {
    return {}
  }
}

/** Persist credentials for a mount and notify listeners (this tab + others). */
export function write(mount: string, values: AuthValues): void {
  if (typeof window === 'undefined') return
  try {
    const pruned = prune(values)
    if (Object.keys(pruned).length === 0) window.localStorage.removeItem(storageKey(mount))
    else window.localStorage.setItem(storageKey(mount), JSON.stringify(pruned))
  } catch {}
  // `storage` events only fire in *other* tabs, so dispatch our own for the
  // current document (the panel and the playground provider both listen).
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { mount } }))
  } catch {}
}

/**
 * Subscribe to credential changes for a mount. Fires on same-tab writes (via the
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

/** Drop empty fields/schemes so storage only holds meaningful values. */
function prune(values: AuthValues): AuthValues {
  const out: AuthValues = {}
  for (const [name, value] of Object.entries(values)) {
    const entry: AuthValue = {}
    if (value.token) entry.token = value.token
    if (value.username) entry.username = value.username
    if (value.password) entry.password = value.password
    if (Object.keys(entry).length > 0) out[name] = entry
  }
  return out
}

/** True when a scheme has any credential filled in. */
export function isFilled(value: AuthValue | undefined): boolean {
  return Boolean(value && (value.token || value.username || value.password))
}
