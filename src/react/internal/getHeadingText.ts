/** Extracts heading text, stripping children marked with `data-toc-exclude`. */
export function getHeadingText(element: Element): string {
  const clone = element.cloneNode(true) as Element
  for (const el of clone.querySelectorAll('[data-toc-exclude]')) el.remove()
  return (clone.textContent ?? '').trim()
}
