'use client'

/**
 * Client-side coordination for navigating to a schema property row from a
 * response example line (or a copied property link). Left-hand schema rows live
 * inside collapsed Base UI accordions; because those panels are kept mounted,
 * the target element is always in the DOM. Each {@link Disclosure} registers its
 * panel element and an `open()` callback here, so navigation can reveal every
 * collapsed ancestor of a target before scrolling to it.
 */

type Registration = {
  panel: HTMLElement
  open: () => void
}

const disclosures = new Set<Registration>()

/** Registers a disclosure panel so it can be auto-opened during navigation. */
export function registerDisclosure(panel: HTMLElement, open: () => void): () => void {
  const registration: Registration = { panel, open }
  disclosures.add(registration)
  return () => {
    disclosures.delete(registration)
  }
}

/**
 * A code sample's anchor registration: `has(id)` reports whether the sample
 * renders a line/span anchored to `id` (a response example line, or a request
 * sample path/query parameter), and `select(id)` reveals it — switching to the
 * owning response tab and/or expanding collapsed query parameters as needed.
 */
type SampleRegistration = {
  has: (id: string) => boolean
  select: (id: string) => void
}

const sampleRegistrations = new Set<SampleRegistration>()
const sampleListeners = new Set<() => void>()

/**
 * Registers a code sample's anchors so a left-hand "Example" click can (a) tell
 * whether a matching right-hand line exists ({@link hasSampleLine}) and (b)
 * reveal it ({@link revealSampleLine}) by switching response tabs / expanding
 * collapsed query parameters first.
 */
export function registerSampleAnchors(registration: SampleRegistration): () => void {
  sampleRegistrations.add(registration)
  for (const listener of sampleListeners) listener()
  return () => {
    sampleRegistrations.delete(registration)
    for (const listener of sampleListeners) listener()
  }
}

/** Whether any registered code sample renders a line/span anchored to `id`. */
export function hasSampleLine(id: string): boolean {
  for (const registration of sampleRegistrations) if (registration.has(id)) return true
  return false
}

/**
 * Subscribes to sample-anchor registration changes (for `useSyncExternalStore`
 * so a left-hand "Example" can reactively gain its clickable affordance once the
 * sibling code sample has mounted and registered).
 */
export function subscribeSampleAnchors(listener: () => void): () => void {
  sampleListeners.add(listener)
  return () => {
    sampleListeners.delete(listener)
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Reveals and scrolls to the element with the given id, opening any registered
 * disclosure panels that contain it first. Returns `false` if no such element
 * exists.
 */
export async function revealAnchor(
  id: string,
  options: { updateHash?: boolean; behavior?: ScrollBehavior } = {},
): Promise<boolean> {
  const target = document.getElementById(id)
  if (!target) return false

  for (const disclosure of disclosures) if (disclosure.panel.contains(target)) disclosure.open()

  // Let controlled accordions commit their open state (mount/reveal) before
  // measuring scroll position.
  await nextFrame()
  await nextFrame()

  const resolved = document.getElementById(id)
  if (!resolved) return false

  resolved.scrollIntoView({ block: 'start', behavior: options.behavior ?? 'smooth' })
  if (options.updateHash !== false) history.pushState(null, '', `#${id}`)
  flash(resolved)
  return true
}

/**
 * The reverse of {@link revealAnchor}: from a left-hand schema/parameter row,
 * reveal and flash the matching line in the right-hand code sample (a response
 * example line, or a request-sample path/query parameter). Switches to the
 * owning response tab and/or expands collapsed query parameters first. Returns
 * `false` when no matching line exists (e.g. request-body properties, which the
 * samples don't anchor).
 */
export async function revealSampleLine(id: string): Promise<boolean> {
  // Reveal the line in the right-hand panel (switch response tab / expand query
  // params) before querying for it (no-op when it is already visible).
  for (const registration of sampleRegistrations)
    if (registration.has(id)) {
      registration.select(id)
      break
    }

  // Let the tab switch / expansion commit before querying for the line.
  await nextFrame()
  await nextFrame()

  const selector = `[data-v-openapi-sample] [data-anchor="${cssEscape(id)}"]`
  const target = document.querySelector<HTMLElement>(selector)
  if (!target) return false

  target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  flash(target)
  return true
}

/** Escapes a string for safe use in a CSS attribute selector. */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/["\\]/g, '\\$&')
}

/**
 * Briefly highlights an element. Mirrors the `:target` flash used when clicking
 * an anchor link, which `history.pushState` cannot trigger (and which never
 * re-fires when navigating to the same id twice). Toggling a data attribute —
 * with a forced reflow in between — restarts the CSS animation every time.
 */
function flash(element: HTMLElement): void {
  element.removeAttribute('data-v-openapi-flash')
  // Force a reflow so the animation restarts even if the attribute persists.
  void element.offsetWidth
  element.setAttribute('data-v-openapi-flash', '')
}
