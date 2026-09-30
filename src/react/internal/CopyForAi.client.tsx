'use client'

import * as React from 'react'
import { useRouter } from 'waku'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'
import { style } from '../../styles/zyzz.config.js'
import { getMarkdownAssetPath } from './markdown-url.js'

namespace styles {
  export const button = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '2',
    fontSize: '13px !custom',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
      '&:disabled': {
        cursor: 'default',
      },
    },
  })

  export const checkIcon = style({
    width: '4',
    height: '4',
    color: 'accent',
  })

  export const clipboardIcon = style({
    width: '4',
    height: '4',
  })
}

type CopyState = 'idle' | 'copying' | 'copied' | 'error'

export function CopyForAi(props: CopyForAi.Props) {
  const { className, frontmatter } = props

  const router = useRouter()
  const [state, setState] = React.useState<CopyState>('idle')

  const handleCopy = React.useCallback(async () => {
    if (state === 'copying') return

    setState('copying')
    try {
      const response = await fetch(getMarkdownAssetPath(router.path))
      if (!response.ok) throw new Error('Failed to fetch markdown')

      const markdown = await response.text()
      await navigator.clipboard.writeText(markdown)

      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch (error) {
      console.error('Failed to copy page for AI:', error)
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }, [router.path, state])

  if (frontmatter?.showAskAi === false) return null

  return (
    <button
      aria-label="Copy page content as markdown for AI"
      {...styles.button({ className })}
      data-v-copy-for-ai
      disabled={state === 'copying'}
      onClick={handleCopy}
      type="button"
    >
      {state === 'copied' ? (
        <LucideCheck {...styles.checkIcon()} />
      ) : (
        <LucideClipboard {...styles.clipboardIcon()} />
      )}
      <span>Copy page for AI</span>
    </button>
  )
}

export declare namespace CopyForAi {
  export type Props = {
    className?: string | undefined
    frontmatter?: { showAskAi?: boolean | undefined } | undefined
  }
}
