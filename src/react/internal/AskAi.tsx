'use client'

import { Menu } from '@base-ui/react/menu'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideClipboard from '~icons/lucide/clipboard'
import LucideFileText from '~icons/lucide/file-text'
import SimpleIconsClaude from '~icons/simple-icons/claude'
import SimpleIconsModelcontextprotocol from '~icons/simple-icons/modelcontextprotocol'
import SimpleIconsOpenai from '~icons/simple-icons/openai'
import { style, vars } from '../../styles/zyzz.config.js'
import { useConfig } from '../useConfig.js'
import { getMarkdownAssetPath } from './markdown-url.js'

namespace styles {
  export const trigger = style({
    display: 'flex',
    height: '100% !custom',
    width: '100% !custom',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingRight: '2',
    paddingLeft: '3',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '100ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          color: 'primary',
        },
      },
    },
  })

  export const triggerLabel = style({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  })

  export const shortcut = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'half',
  })

  export const shortcutKey = style({
    display: 'flex',
    height: '5',
    width: 'auto !custom',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    paddingInline: 'threeQuarters',
    fontSize: 'xs',
    lineHeight: 'xs',
  })

  export const positioner = style({
    zIndex: 100,
  })

  export const popup = style({
    width: 'var(--anchor-width) !custom',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    padding: '2',
    opacity: '100%',
    boxShadow:
      '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '75ms !custom',
    selectors: {
      '&[data-starting-style]': {
        scale: '90% 90%',
        opacity: '0%',
      },
    },
  })

  export const groupLabel = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'oneAndHalf',
    paddingInline: '2',
    paddingBlock: 'oneAndHalf',
    fontSize: 'xs',
    lineHeight: 'xs',
    fontWeight: 'medium',
    color: 'secondary',
  })

  export const item = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '2',
    borderRadius: 'md',
    paddingInline: '2',
    paddingBlock: 'oneAndHalf',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 80%, transparent) !custom`,
    },
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'accenta3',
          color: 'heading',
        },
      },
    },
  })

  export const icon = style({
    width: '4',
    height: '4',
  })

  export const separator = style({
    marginBlock: '2',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: 'primary',
  })
}

export function AskAi(props: AskAi.Props) {
  const { className } = props

  const { path } = useRouter()
  const { mcp } = useConfig()

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [mcpCopied, setMcpCopied] = React.useState(false)

  const [modifierKey, setModifierKey] = React.useState('⌘')
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const apple = /(Mac|iPhone|iPod|iPad)/i.test(window.navigator.platform)
    setModifierKey(apple ? '⌘' : 'Ctrl')
  }, [])

  React.useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timeout)
  }, [copied])

  React.useEffect(() => {
    if (!mcpCopied) return
    const timeout = setTimeout(() => setMcpCopied(false), 1500)
    return () => clearTimeout(timeout)
  }, [mcpCopied])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setMenuOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pageUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin + path
  }, [path])

  const query = React.useMemo(() => {
    return `Please research and analyze this page: ${pageUrl} so I can ask you questions about it. Once you have read it, prompt me with any questions I have. Do not post content from the page in your response. Any of my follow up questions must reference the site I gave you.`
  }, [pageUrl])

  const llmProviders = React.useMemo(
    () => [
      {
        name: 'ChatGPT',
        icon: SimpleIconsOpenai,
        url: `https://chatgpt.com?hints=search&q=${encodeURIComponent(query)}`,
      },
      {
        name: 'Claude',
        icon: SimpleIconsClaude,
        url: `https://claude.ai/new?q=${encodeURIComponent(query)}`,
      },
    ],
    [query],
  )

  const markdownUrl = React.useMemo(() => {
    return getMarkdownAssetPath(path)
  }, [path])

  const copyPageForAi = React.useCallback(async () => {
    try {
      const response = await fetch(markdownUrl)
      if (!response.ok) throw new Error('Failed to fetch markdown')
      const text = await response.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
    }
  }, [markdownUrl, pageUrl])

  const viewAsMarkdown = React.useCallback(() => {
    window.open(markdownUrl, '_blank')
  }, [markdownUrl])

  const mcpUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/api/mcp`
  }, [])

  return (
    <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Menu.Trigger {...styles.trigger({ className })}>
        <div {...styles.triggerLabel()}>Ask AI...</div>
        <div {...styles.shortcut()}>
          <div {...styles.shortcutKey()}>{modifierKey}</div>
          <div {...styles.shortcutKey()}>I</div>
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={4} {...styles.positioner()}>
          <Menu.Popup {...styles.popup()}>
            <Menu.Group>
              <Menu.GroupLabel {...styles.groupLabel()}>Open in...</Menu.GroupLabel>
              {llmProviders.map((provider) => (
                <Menu.Item
                  key={provider.name}
                  {...styles.item()}
                  onClick={() => {
                    // On mobile, use location.href to trigger Universal Links / App Links
                    // which will open the native app if installed
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                    if (isMobile) {
                      window.location.href = provider.url
                    } else {
                      window.open(provider.url, '_blank')
                    }
                  }}
                >
                  <provider.icon {...styles.icon()} />
                  {provider.name}
                </Menu.Item>
              ))}
            </Menu.Group>

            <Menu.Separator {...styles.separator()} />

            <Menu.Item closeOnClick={false} {...styles.item()} onClick={copyPageForAi}>
              <LucideClipboard {...styles.icon()} />
              {copied ? 'Copied!' : 'Copy page for AI'}
            </Menu.Item>

            <Menu.Item {...styles.item()} onClick={viewAsMarkdown}>
              <LucideFileText {...styles.icon()} />
              View as Markdown
            </Menu.Item>

            {mcp?.enabled && (
              <>
                <Menu.Separator {...styles.separator()} />
                <Menu.Item
                  closeOnClick={false}
                  {...styles.item()}
                  onClick={() => {
                    navigator.clipboard.writeText(mcpUrl)
                    setMcpCopied(true)
                  }}
                >
                  <SimpleIconsModelcontextprotocol {...styles.icon()} />
                  {mcpCopied ? 'Copied!' : 'Copy MCP URL'}
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export declare namespace AskAi {
  export type Props = {
    className?: string | undefined
  }
}
