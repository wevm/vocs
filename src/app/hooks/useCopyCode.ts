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

    const lines = ref.current?.querySelectorAll('[data-line]:not(.diff.remove)')

    let text = ''
    for (const line of lines ?? []) text += `${line.textContent || ''}\n`
    text = text.slice(0, -1)

    navigator.clipboard.writeText(text)
  }

  return {
    copied,
    copy,
    ref,
  }
}
