import clsx from 'clsx'
import { DropdownMenu } from 'radix-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import { useConfig } from '../hooks/useConfig.js'
import { usePageData } from '../hooks/usePageData.js'
import * as styles from './AiCtaDropdown.css.js'
import * as buttonStyles from './Button.css.js'
import { CheckCircle } from './icons/CheckCircle.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { Copy } from './icons/Copy.js'
import { OpenAi } from './icons/OpenAi.js'
import { Link } from './Link.js'

export function AiCtaDropdown() {
  const { content } = usePageData()
  const { aiCta } = useConfig()
  const location = useLocation()

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied])

  const copy = useCallback(() => {
    setCopied(true)
    navigator.clipboard.writeText(content ?? '')
  }, [content])

  const query = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const href = window.location.origin + location.pathname
    if (typeof aiCta === 'object') return aiCta.query({ location: href })
    return `Please research and analyze this page: ${href} so I can ask you questions about it. Once you have read it, prompt me with any questions I have. Do not post content from the page in your response. Any of my follow up questions must reference the site I gave you.`
  }, [aiCta, location.pathname])

  return (
    <div className={styles.root}>
      {copied ? (
        <div className={clsx(buttonStyles.button, styles.buttonLeft)}>
          <div style={{ width: '14px', height: '14px' }}>
            <CheckCircle />
          </div>
          Copied
        </div>
      ) : (
        <Link
          className={clsx(buttonStyles.button, styles.buttonLeft)}
          href={`https://chatgpt.com?hints=search&q=${encodeURIComponent(query)}`}
          variant="styleless"
        >
          <div style={{ width: '14px', height: '14px' }}>
            <OpenAi />
          </div>
          Ask in ChatGPT
        </Link>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={clsx(buttonStyles.button, styles.buttonRight)} type="button">
            <div style={{ width: '14px', height: '14px' }}>
              <ChevronDown />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className={styles.dropdownMenuContent} sideOffset={4}>
            <DropdownMenu.Item className={styles.dropdownMenuItem} onClick={copy}>
              <div style={{ width: '14px', height: '14px' }}>
                <Copy />
              </div>
              Copy page for LLMs
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
