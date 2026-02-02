'use client'

import * as React from 'react'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'
import { getIconHtml } from './utils.js'

export function CopyButton() {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = React.useState(false)
  const [singleLine, setSingleLine] = React.useState(false)
  const [hasShellPrompts, setHasShellPrompts] = React.useState(false)

  React.useEffect(() => {
    const pre = buttonRef.current?.parentElement as HTMLPreElement | null
    if (!pre) return
    const lineCount = pre.querySelectorAll('.line').length
    setSingleLine(lineCount <= 1)
    // Only hide copy button if there are actual shell prompt lines (per-line copy buttons)
    const shellLineCount = pre.querySelectorAll('.line[data-v-shell-line]').length
    setHasShellPrompts(shellLineCount > 0)
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

  if (hasShellPrompts) return null
  return (
    <button
      ref={buttonRef}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="vocs:absolute vocs:top-2.5 vocs:data-[single-line=true]:top-1/2 vocs:data-[single-line=true]:-translate-y-1/2 vocs:right-2.5 vocs:p-1.5 vocs:rounded-md vocs:opacity-0 vocs:transition-opacity vocs:duration-150 vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:group-hover/code:opacity-100 vocs:data-[copied=true]:opacity-100 vocs:data-[copied=true]:text-success"
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

const clipboardIconHtml = getIconHtml('clipboard', 'vocs:size-3.5')
const checkIconHtml = getIconHtml('check', 'vocs:size-3.5')

function createIconElement(html: string): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstChild as HTMLElement
}

export function ShellLineCopyButtons() {
  const containerRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const pre = containerRef.current?.closest('pre') as HTMLPreElement | null
    if (!pre) return
    const shellLines = Array.from(pre.querySelectorAll('.line[data-v-shell-line]')) as HTMLElement[]

    const buttons: HTMLButtonElement[] = []

    for (const line of shellLines) {
      if (line.querySelector('[data-v-shell-copy]')) continue

      const button = document.createElement('button')
      button.setAttribute('aria-label', 'Copy command')
      button.setAttribute('data-v-shell-copy', '')
      button.setAttribute('type', 'button')
      const clipboardIcon = createIconElement(clipboardIconHtml)
      const checkIcon = createIconElement(checkIconHtml)
      checkIcon.style.display = 'none'
      button.appendChild(clipboardIcon)
      button.appendChild(checkIcon)

      button.addEventListener('click', () => {
        const clone = line.cloneNode(true) as HTMLElement
        clone.querySelector('[data-v-shell-prompt]')?.remove()
        clone.querySelector('[data-v-shell-copy]')?.remove()
        const text = clone.textContent?.trim() ?? ''
        navigator.clipboard.writeText(text)

        button.setAttribute('data-copied', 'true')
        clipboardIcon.style.display = 'none'
        checkIcon.style.display = ''

        setTimeout(() => {
          const isVisible =
            button.matches(':hover') || button.matches(':focus') || line.matches(':hover')
          button.removeAttribute('data-copied')
          setTimeout(
            () => {
              clipboardIcon.style.display = ''
              checkIcon.style.display = 'none'
            },
            isVisible ? 0 : 150,
          )
        }, 1_000)
      })

      line.appendChild(button)
      buttons.push(button)
    }

    return () => {
      for (const btn of buttons) btn.remove()
    }
  }, [])

  return <span ref={containerRef} className="vocs:hidden" />
}
