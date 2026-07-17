'use client'

import { Tooltip } from '@base-ui/react/tooltip'
import * as React from 'react'
import LucideScanText from '~icons/lucide/scan-text'
import RiSparkling2Fill from '~icons/ri/sparkling-2-fill'
import SimpleIconsClaude from '~icons/simple-icons/claude'
import SimpleIconsOpenai from '~icons/simple-icons/openai'

type State = 'copied' | 'error' | 'idle'

export function PromptFrame(props: PromptFrame.Props) {
  const { children, className, value } = props
  const contentId = React.useId()
  const encodedValue = encodeURIComponent(value)
  const [expanded, setExpanded] = React.useState(false)
  const [state, setState] = React.useState<State>('idle')

  React.useEffect(() => {
    if (state !== 'copied' && state !== 'error') return
    const timeout = setTimeout(() => setState('idle'), 2_000)
    return () => clearTimeout(timeout)
  }, [state])

  const copy = React.useCallback(() => {
    try {
      navigator.clipboard.writeText(value).then(
        () => setState('copied'),
        () => setState('error'),
      )
    } catch {
      setState('error')
    }
  }, [value])

  const copyFromFrame = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented) return
      if (event.target instanceof Element && event.target.closest('a, button')) return
      if (window.getSelection()?.isCollapsed === false) return
      copy()
    },
    [copy],
  )

  const label = {
    copied: 'Copied instructions',
    error: 'Copy failed',
    idle: 'Copy instructions for agent',
  }[state]

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: _
    <figure
      className={className}
      data-expanded={expanded}
      data-state={state}
      data-v-prompt
      onClick={copyFromFrame}
    >
      <figcaption data-v-prompt-header>
        <button
          aria-label={label}
          data-state={state}
          data-v-prompt-copy
          onClick={copy}
          type="button"
        >
          <RiSparkling2Fill aria-hidden data-v-prompt-icon />
          <span aria-live="polite">{label}</span>
        </button>
        <Tooltip.Provider delay={300}>
          <span data-v-prompt-actions>
            <PromptAction
              label="Open in ChatGPT"
              render={
                // biome-ignore lint/a11y/useAnchorContent: _
                <a
                  aria-label="Open in ChatGPT"
                  href={`https://chatgpt.com?hints=search&q=${encodedValue}`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              <SimpleIconsOpenai aria-hidden />
            </PromptAction>
            <PromptAction
              label="Open in Claude"
              render={
                // biome-ignore lint/a11y/useAnchorContent: _
                <a
                  aria-label="Open in Claude"
                  href={`https://claude.ai/new?q=${encodedValue}`}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              <SimpleIconsClaude aria-hidden />
            </PromptAction>
            <PromptAction
              label={expanded ? 'Hide Prompt' : 'View Prompt'}
              render={
                <button
                  aria-controls={contentId}
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Hide Prompt' : 'View Prompt'}
                  data-v-prompt-toggle
                  onClick={() => setExpanded((expanded) => !expanded)}
                  type="button"
                />
              }
            >
              <LucideScanText aria-hidden />
            </PromptAction>
          </span>
        </Tooltip.Provider>
      </figcaption>
      <div data-v-prompt-content hidden={!expanded} id={contentId}>
        <pre data-v-prompt-body>
          <code>{children}</code>
        </pre>
      </div>
    </figure>
  )
}

export declare namespace PromptFrame {
  type Props = {
    children: React.ReactNode
    className?: string | undefined
    value: string
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function PromptAction(props: PromptAction.Props) {
  const { children, label, render } = props
  return (
    <Tooltip.Root>
      <Tooltip.Trigger data-v-prompt-action render={render}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="vocs:z-50" side="top" sideOffset={6}>
          <Tooltip.Popup data-v-prompt-tooltip>{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

declare namespace PromptAction {
  type Props = {
    children: React.ReactNode
    label: string
    render: React.ReactElement
  }
}
