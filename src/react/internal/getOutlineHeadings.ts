/**
 * Returns the page headings that belong in the outline.
 *
 * - Changelog release bodies render as nested `[data-v-content]` inside the main
 *   article; their headings have their own `Versions` outline, so keep them out
 *   of the page outline (otherwise they flood/leak into it).
 * - Headings inside hidden content (e.g. inactive `<Tab>` panels, which stay
 *   mounted) are not visible, so keep them out until they are shown.
 */
export function getOutlineHeadings(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('article[data-v-content] :is(h2, h3, h4, h5, h6)[id]'),
  ).filter((element) => !element.closest('[data-v-changelog]') && !element.closest('[hidden]'))
}
