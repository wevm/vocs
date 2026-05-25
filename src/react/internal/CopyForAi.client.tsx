'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideCheck from '~icons/lucide/check'
import LucideClipboard from '~icons/lucide/clipboard'

type CopyState = 'idle' | 'copying' | 'copied' | 'error'

export function CopyForAi(props: CopyForAi.Props) {
  const { className, frontmatter } = props

  const router = useRouter()
  const [state, setState] = React.useState<CopyState>('idle')

  const handleCopy = React.useCallback(async () => {
    if (state === 'copying') return

    setState('copying')
    try {
      let pagePath = router.path
      if (pagePath === '/') pagePath = '/index'
      else pagePath = pagePath.replace(/\/$/, '')

      const response = await fetch(`/assets/md${pagePath}.md`)
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
      className={cx(
        'vocs:flex vocs:items-center vocs:gap-2 vocs:text-[13px] vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:disabled:cursor-default vocs:transition-colors',
        className,
      )}
      data-v-copy-for-ai
      disabled={state === 'copying'}
      onClick={handleCopy}
      type="button"
    >
      {state === 'copied' ? (
        <LucideCheck className="vocs:size-4 vocs:text-accent" />
      ) : (
        <LucideClipboard className="vocs:size-4" />
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
