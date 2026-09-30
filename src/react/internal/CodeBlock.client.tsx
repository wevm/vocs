'use client'

import * as React from 'react'
import { Html } from 'zyzz/runtime'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'
import LucideWrapText from '~icons/lucide/wrap-text'
import { style } from '../../styles/zyzz.config.js'

namespace styles {
  export const wrapButton = style({
    position: 'absolute',
    top: 'twoAndHalf',
    right: '10',
    cursor: 'pointer',
    borderRadius: 'md',
    padding: 'oneAndHalf',
    color: 'secondary',
    opacity: '0%',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:is(:where(.vocs\\:group\\/code):hover *)': {
        '@media (hover: hover)': {
          opacity: '100%',
        },
      },
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
      '&[data-single-line="true"]': {
        top: 'calc(1 / 2 * 100%) !custom',
        translate: '0 calc(calc(1 / 2 * 100%) * -1) !custom',
      },
      '&[data-wrapped="true"]': {
        color: 'accent',
        opacity: '100%',
      },
    },
  })

  export const wrapIcon = style({
    width: '4',
    height: '4',
  })

  export const copyButton = style({
    position: 'absolute',
    top: 'twoAndHalf',
    right: 'twoAndHalf',
    cursor: 'pointer',
    borderRadius: 'md',
    padding: 'oneAndHalf',
    color: 'secondary',
    opacity: '0%',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:is(:where(.vocs\\:group\\/code):hover *)': {
        '@media (hover: hover)': {
          opacity: '100%',
        },
      },
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
      '&[data-copied="true"]': {
        color: 'success',
        opacity: '100%',
      },
      '&[data-single-line="true"]': {
        top: 'calc(1 / 2 * 100%) !custom',
        translate: '0 calc(calc(1 / 2 * 100%) * -1) !custom',
      },
    },
  })

  export const lineCopyButtons = style({
    display: 'none',
  })

  export const copyIcon = style({
    width: 'threeAndHalf',
    height: 'threeAndHalf',
  })
}

export function WrapButton({ defaultWrapped = false }: WrapButton.Props) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [wrapped, setWrapped] = React.useState(defaultWrapped)
  const [singleLine, setSingleLine] = React.useState(false)

  React.useEffect(() => {
    const pre = buttonRef.current?.parentElement as HTMLPreElement | null
    if (!pre) return
    const lineCount = pre.querySelectorAll('.line').length
    setSingleLine(lineCount <= 1)
  }, [])

  const toggle = React.useCallback(() => {
    const pre = buttonRef.current?.parentElement as HTMLPreElement | null
    if (!pre) return
    const next = !wrapped
    setWrapped(next)
    if (next) pre.setAttribute('data-v-wrapped', '')
    else pre.removeAttribute('data-v-wrapped')
  }, [wrapped])

  return (
    <button
      ref={buttonRef}
      aria-label={wrapped ? 'Disable word wrap' : 'Enable word wrap'}
      aria-pressed={wrapped}
      {...styles.wrapButton()}
      data-wrapped={wrapped}
      data-single-line={singleLine}
      onClick={toggle}
      type="button"
    >
      <LucideWrapText {...styles.wrapIcon()} />
    </button>
  )
}

export declare namespace WrapButton {
  type Props = {
    defaultWrapped?: boolean | undefined
  }
}

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
      {...styles.copyButton()}
      data-copied={copied}
      data-single-line={singleLine}
      onClick={copy}
      type="button"
    >
      {copied ? <LucideCheck {...styles.wrapIcon()} /> : <LucideClipboard {...styles.wrapIcon()} />}
    </button>
  )
}

const clipboardIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" ${Html.serialize(Html.from(styles.copyIcon()))} fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`
const checkIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" ${Html.serialize(Html.from(styles.copyIcon()))} fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`

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
        let text = clone.textContent?.trim() ?? ''

        // Collect continuation lines (lines after backslash continuations)
        if (text.endsWith('\\')) {
          const allLines = Array.from(pre.querySelectorAll('.line')) as HTMLElement[]
          const startIdx = allLines.indexOf(line)
          for (let i = startIdx + 1; i < allLines.length; i++) {
            const next = allLines[i]
            if (!next) continue
            if (next.hasAttribute('data-v-shell-line')) break
            const nextClone = next.cloneNode(true) as HTMLElement
            nextClone.querySelector('[data-v-shell-copy]')?.remove()
            const nextText = nextClone.textContent ?? ''
            if (!nextText.trim()) break
            text += '\n' + nextText
            if (!nextText.trimEnd().endsWith('\\')) break
          }
        }

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

  return <span ref={containerRef} {...styles.lineCopyButtons()} />
}
