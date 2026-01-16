'use client'

import { Menu } from '@base-ui/react/menu'
import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideClipboard from '~icons/lucide/clipboard'
import LucideFileText from '~icons/lucide/file-text'
import SimpleIconsClaude from '~icons/simple-icons/claude'
import SimpleIconsModelcontextprotocol from '~icons/simple-icons/modelcontextprotocol'
import SimpleIconsOpenai from '~icons/simple-icons/openai'
import { useConfig } from '../useConfig.js'

export function AskAi(props: AskAi.Props) {
  const { className } = props

  const { path } = useRouter()
  const { mcp } = useConfig()

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

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
    if (path === '/') return `${pageUrl}index.md`
    const url = pageUrl.endsWith('/') ? pageUrl.slice(0, -1) : pageUrl
    return `${url}.md`
  }, [pageUrl, path])

  const copyPageForAi = React.useCallback(async () => {
    try {
      const response = await fetch(markdownUrl)
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
      <Menu.Trigger
        className={cx(
          'vocs:flex vocs:items-center vocs:justify-between vocs:cursor-pointer vocs:pl-3 vocs:pr-2 vocs:text-sm vocs:text-secondary vocs:hover:text-primary vocs:w-full vocs:h-full vocs:bg-surface vocs:hover:bg-surfaceTint vocs:border vocs:border-primary vocs:rounded-xl vocs:transition-colors vocs:duration-100',
          className,
        )}
      >
        <div className="vocs:flex vocs:items-center vocs:gap-2">Ask AI...</div>
        <div className="vocs:flex vocs:items-center vocs:gap-0.5">
          <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
            {modifierKey}
          </div>
          <div className="vocs:bg-primary vocs:text-xs vocs:flex vocs:items-center vocs:justify-center vocs:size-5 vocs:border vocs:border-primary vocs:rounded-sm">
            I
          </div>
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={4} className="vocs:z-100">
          <Menu.Popup className="vocs:bg-surface vocs:w-(--anchor-width) vocs:border vocs:border-primary vocs:p-2 vocs:rounded-lg vocs:shadow-lg/5 vocs:origin-(--transform-origin) vocs:transition-all vocs:duration-75 vocs:scale-100 vocs:opacity-100 vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-90">
            <Menu.Group>
              <Menu.GroupLabel className="vocs:flex vocs:items-center vocs:gap-1.5 vocs:px-2 vocs:py-1.5 vocs:text-secondary vocs:text-xs vocs:font-medium">
                Open in...
              </Menu.GroupLabel>
              {llmProviders.map((provider) => (
                <Menu.Item
                  key={provider.name}
                  className="vocs:flex vocs:items-center vocs:gap-2 vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:hover:text-heading vocs:hover:bg-accenta3 vocs:rounded-md vocs:text-sm vocs:cursor-pointer vocs:transition-colors"
                  onClick={() => window.open(provider.url, '_blank')}
                >
                  <provider.icon className="vocs:size-4" />
                  {provider.name}
                </Menu.Item>
              ))}
            </Menu.Group>

            <Menu.Separator className="vocs:my-2 vocs:border-t vocs:border-primary" />

            <Menu.Item
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:hover:text-heading vocs:hover:bg-accenta3 vocs:rounded-md vocs:text-sm vocs:cursor-pointer vocs:transition-colors"
              onClick={copyPageForAi}
            >
              <LucideClipboard className="vocs:size-4" />
              {copied ? 'Copied!' : 'Copy page for AI'}
            </Menu.Item>

            <Menu.Item
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:hover:text-heading vocs:hover:bg-accenta3 vocs:rounded-md vocs:text-sm vocs:cursor-pointer vocs:transition-colors"
              onClick={viewAsMarkdown}
            >
              <LucideFileText className="vocs:size-4" />
              View as Markdown
            </Menu.Item>

            {mcp?.enabled && (
              <>
                <Menu.Separator className="vocs:my-2 vocs:border-t vocs:border-primary" />
                <Menu.Item
                  className="vocs:flex vocs:items-center vocs:gap-2 vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:hover:text-heading vocs:hover:bg-accenta3 vocs:rounded-md vocs:text-sm vocs:cursor-pointer vocs:transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(mcpUrl)
                  }}
                >
                  <SimpleIconsModelcontextprotocol className="vocs:size-4" />
                  Install MCP
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
