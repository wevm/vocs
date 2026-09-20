'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'
import { getMarkdownAssetPath } from './markdown-url.js'

namespace styles {
  export const copyForAi = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    fontSize: '13px',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&:disabled': { cursor: 'default' },
    },
  })
  export const copyForAi2 = style({
    width: 4,
    height: 4,
    color: theme.vars.color.blue['900'],
  })
  export const copyForAi3 = style({ width: 4, height: 4 })
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
      className={cx(styles.copyForAi().className, className)}
      data-v-copy-for-ai
      disabled={state === 'copying'}
      onClick={handleCopy}
      type="button"
    >
      {state === 'copied' ? (
        <LucideCheck className={styles.copyForAi2().className} />
      ) : (
        <LucideClipboard className={styles.copyForAi3().className} />
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
