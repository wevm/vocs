/**
 * Behavior of code tabs and copy buttons in server-rendered HTML. Permalinks inline `script`, so
 * they switch tabs and copy code without React or a second request. The block components share
 * `copyText`, so both copy the same text.
 *
 * `script` embeds the functions as source text, so each function references only its parameters
 * and globals, and declares no named inner function that a bundler could wrap in a helper.
 * @module
 */

/**
 * Returns the visible code of the block that holds a copy button. The text leaves out inactive
 * tabs, and the popups, query lines, and error lines of Twoslash.
 */
export function copyText(button: Element): string {
  const code = button.closest('figure')?.querySelector('[data-vocs-part="pre"]:not([hidden]) code')
  if (!code) return ''

  const clone = code.cloneNode(true) as Element
  for (const node of clone.querySelectorAll('[data-vocs-part="popup"]')) node.remove()

  // Highlighted code holds one `.line` per source line. Twoslash puts its query and error lines
  // in place of the newline between two lines, so the text joins the lines instead.
  const lines = clone.querySelectorAll('.line')
  if (lines.length === 0) return clone.textContent ?? ''
  return Array.from(lines, (line) => line.textContent).join('\n')
}

/**
 * Handles clicks on code tabs and copy buttons under `root`, with one delegated listener. A tab
 * click shows the panel its `aria-controls` names and hides the panels of the other tabs. A copy
 * click writes the code to the clipboard, and marks the button `copied` until the pointer leaves
 * it or it loses focus.
 */
export function enhance(root: Document, copy: typeof copyText): void {
  root.addEventListener('click', (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest('[data-vocs-part="copy"], [data-vocs-part="tab"]')
        : null
    if (!target) return

    if (target.getAttribute('data-vocs-part') === 'copy') {
      void navigator.clipboard.writeText(copy(target)).then(() => {
        target.setAttribute('data-state', 'copied')
        target.textContent = 'Copied'
        for (const type of ['blur', 'mouseleave'])
          target.addEventListener(
            type,
            () => {
              target.setAttribute('data-state', 'idle')
              target.textContent = 'Copy'
            },
            { once: true },
          )
      })
      return
    }

    for (const tab of target.parentElement?.querySelectorAll('[data-vocs-part="tab"]') ?? []) {
      const selected = tab === target
      tab.setAttribute('aria-selected', String(selected))
      tab.setAttribute('data-state', selected ? 'active' : 'inactive')
      root
        .getElementById(tab.getAttribute('aria-controls') ?? '')
        ?.toggleAttribute('hidden', !selected)
    }
  })
}

/** An inline module that runs `enhance` on the document. */
export const script = `(${enhance})(document, ${copyText})`
