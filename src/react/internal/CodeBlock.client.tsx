'use client'

import * as React from 'react'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'

export function CopyButton() {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = React.useState(false)
  const [singleLine, setSingleLine] = React.useState(false)

  React.useEffect(() => {
    const pre = buttonRef.current?.parentElement as HTMLPreElement | null
    if (!pre) return
    const lineCount = pre.querySelectorAll('.line').length
    setSingleLine(lineCount <= 1)
  }, [])

  React.useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied])

  const copy = React.useCallback(() => {
    const pre = buttonRef.current?.parentElement as HTMLPreElement | null
    if (!pre) return

    const node = pre.cloneNode(true) as HTMLPreElement
    const nodesToRemove = node.querySelectorAll(
      '.line.diff.remove,.twoslash-popup-info-hover,.twoslash-popup-info,.twoslash-meta-line,.twoslash-tag-line',
    )
    for (const el of nodesToRemove) el.remove()
    const text = (node.textContent ?? '').replace(/\n{2,}/g, '\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
  }, [])

  return (
    <button
      ref={buttonRef}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="vocs:absolute vocs:top-2.5 vocs:data-[single-line=true]:top-1/2 vocs:data-[single-line=true]:-translate-y-1/2 vocs:right-2.5 vocs:p-1.5 vocs:rounded-md vocs:opacity-0 vocs:transition-opacity vocs:duration-150 vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:group-hover/code:opacity-100 vocs:data-[copied=true]:opacity-100 vocs:data-[copied=true]:text-green-500"
      data-copied={copied}
      data-single-line={singleLine}
      onClick={copy}
      type="button"
    >
      {copied ? (
        <LucideCheck className="vocs:size-4" />
      ) : (
        <LucideClipboard className="vocs:size-4" />
      )}
    </button>
  )
}
