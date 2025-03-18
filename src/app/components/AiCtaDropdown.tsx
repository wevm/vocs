import clsx from 'clsx'
import { DropdownMenu } from 'radix-ui'
import { useEffect, useCallback, useState } from 'react'

import { Link } from './Link.js'
import * as buttonStyles from './Button.css.js'
import * as styles from './AiCtaDropdown.css.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { OpenAi } from './icons/OpenAi.js'
import { Copy } from './icons/Copy.js'
import { usePageData } from '../hooks/usePageData.js'
import { CheckCircle } from './icons/CheckCircle.js'

export function AiCtaDropdown() {
  const { content } = usePageData()

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
          href={`https://chatgpt.com?hints=search&q=${encodeURIComponent(
            `Hi there! Please research and analyze this page: ${window.location.href} so I can ask you questions about it. Once you have read it, ask me if you have any questions. Do not post content of the from the page.`,
          )}`}
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
