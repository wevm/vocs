export function debounce(fn: () => void, delay: number): () => void {
  let invoked = false
  return () => {
    invoked = true
    setTimeout(() => {
      if (invoked) fn()
      invoked = false
    }, delay)
  }
}
