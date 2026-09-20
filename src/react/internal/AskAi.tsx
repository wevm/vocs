'use client'

import { Menu } from '@base-ui/react/menu'
import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideClipboard from '~icons/lucide/clipboard'
import LucideFileText from '~icons/lucide/file-text'
import SimpleIconsClaude from '~icons/simple-icons/claude'
import SimpleIconsModelcontextprotocol from '~icons/simple-icons/modelcontextprotocol'
import SimpleIconsOpenai from '~icons/simple-icons/openai'
import { useConfig } from '../useConfig.js'
import { getMarkdownAssetPath } from './markdown-url.js'

namespace styles {
  export const askAi = style({
    display: 'flex',
    height: '100%',
    width: '100%',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'xl',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingRight: 2,
    paddingLeft: 3,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.gray['100'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const askAi2 = style({ display: 'flex', alignItems: 'center', gap: 2 })
  export const askAi3 = style({ display: 'flex', alignItems: 'center', gap: 'calc(0.25rem * 0.5)' })
  export const askAi4 = style({
    display: 'flex',
    height: 5,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 0.75)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
  })
  export const askAi5 = style({
    display: 'flex',
    height: 5,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 'calc(0.25rem * 0.75)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
  })
  export const askAi6 = style({ zIndex: 100 })
  export const askAi7 = style({
    width: 'var(--anchor-width)',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    padding: 2,
    opacity: '100%',
    boxShadow:
      '0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '75ms',
    selectors: {
      '&[data-starting-style]': {
        scale: '90% 90%',
        opacity: '0%',
        borderStyle: 'solid',
        boxShadow:
          '0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  })
  export const askAi8 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    fontWeight: 'medium',
    color: theme.vars.color.gray['900'],
  })
  export const askAi9 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.blue['300'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const askAi10 = style({ width: 4, height: 4 })
  export const askAi11 = style({
    marginBlock: 2,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
  })
  export const askAi12 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.blue['300'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const askAi13 = style({ width: 4, height: 4 })
  export const askAi14 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.blue['300'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const askAi15 = style({ width: 4, height: 4 })
  export const askAi16 = style({
    marginBlock: 2,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
  })
  export const askAi17 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: theme.vars.color.blue['300'],
          color: theme.vars.color.foreground,
        },
      },
    },
  })
  export const askAi18 = style({ width: 4, height: 4 })
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
      <Menu.Trigger className={cx(styles.askAi().className, className)}>
        <div {...styles.askAi2()}>Ask AI...</div>
        <div {...styles.askAi3()}>
          <div {...styles.askAi4()}>{modifierKey}</div>
          <div {...styles.askAi5()}>I</div>
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="top"
          align="start"
          sideOffset={4}
          className={styles.askAi6().className}
        >
          <Menu.Popup className={styles.askAi7().className}>
            <Menu.Group>
              <Menu.GroupLabel className={styles.askAi8().className}>Open in...</Menu.GroupLabel>
              {llmProviders.map((provider) => (
                <Menu.Item
                  key={provider.name}
                  className={styles.askAi9().className}
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
                  <provider.icon {...styles.askAi10()} />
                  {provider.name}
                </Menu.Item>
              ))}
            </Menu.Group>

            <Menu.Separator className={styles.askAi11().className} />

            <Menu.Item
              closeOnClick={false}
              className={styles.askAi12().className}
              onClick={copyPageForAi}
            >
              <LucideClipboard className={styles.askAi13().className} />
              {copied ? 'Copied!' : 'Copy page for AI'}
            </Menu.Item>

            <Menu.Item className={styles.askAi14().className} onClick={viewAsMarkdown}>
              <LucideFileText className={styles.askAi15().className} />
              View as Markdown
            </Menu.Item>

            {mcp?.enabled && (
              <>
                <Menu.Separator className={styles.askAi16().className} />
                <Menu.Item
                  closeOnClick={false}
                  className={styles.askAi17().className}
                  onClick={() => {
                    navigator.clipboard.writeText(mcpUrl)
                    setMcpCopied(true)
                  }}
                >
                  <SimpleIconsModelcontextprotocol className={styles.askAi18().className} />
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
