import { useEffect, useRef, useState } from 'react'

export function useCopyCode() {
  const ref = useRef<HTMLPreElement>(null)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied])

  function copy() {
    setCopied(true)

    const node = ref.current?.cloneNode(true) as HTMLPreElement
    const nodesToRemove = node?.querySelectorAll(
      'button,.line.diff.remove,.twoslash-popup-info-hover,.twoslash-popup-info,.twoslash-meta-line,.twoslash-tag-line',
    )
    for (const node of nodesToRemove ?? []) node.remove()
    navigator.clipboard.writeText(node?.textContent as string)
  }

  return {
    copied,
    copy,
    ref,
  }
}
