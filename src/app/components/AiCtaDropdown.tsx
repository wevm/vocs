import clsx from 'clsx'
import { DropdownMenu } from 'radix-ui'
import { type FC, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import type { AiModel } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { usePageData } from '../hooks/usePageData.js'
import * as styles from './AiCtaDropdown.css.js'
import * as buttonStyles from './Button.css.js'
import { CheckCircle } from './icons/CheckCircle.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { Claude } from './icons/Claude.js'
import { Copy } from './icons/Copy.js'
import { Gemini } from './icons/Gemini.js'
import { OpenAi } from './icons/OpenAi.js'
import { Link } from './Link.js'

type ModelDef = {
  label: string
  icon: FC
  href: (query: string) => string
}

const AI_MODELS: Record<AiModel, ModelDef> = {
  chatgpt: {
    label: 'Ask in ChatGPT',
    icon: OpenAi,
    href: (query) => `https://chatgpt.com?hints=search&q=${encodeURIComponent(query)}`,
  },
  claude: {
    label: 'Ask in Claude',
    icon: Claude,
    href: (query) => `https://claude.ai/new?q=${encodeURIComponent(query)}`,
  },
  gemini: {
    label: 'Ask in Gemini',
    icon: Gemini,
    // gemini.google.com does not support prefilling a prompt via URL; use Google AI Mode (udm=50) instead until it does.
    href: (query) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`,
  },
}

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

  const [query, setQuery] = useState('')

  useEffect(() => {
    const href = window.location.origin + location.pathname
    if (typeof aiCta === 'object' && aiCta.query) setQuery(aiCta.query({ location: href }))
    else
      setQuery(
        `Please research and analyze this page: ${href} so I can ask you questions about it. Once you have read it, prompt me with any questions I have. Do not post content from the page in your response. Any of my follow up questions must reference the site I gave you.`,
      )
  }, [aiCta, location.pathname])

  const defaultModels = Object.keys(AI_MODELS) as AiModel[]
  const [primaryKey = 'chatgpt', ...secondaryModels] =
    typeof aiCta === 'object' && aiCta.models?.length ? aiCta.models : defaultModels
  const primary = AI_MODELS[primaryKey]

  const PrimaryIcon = primary.icon

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
          href={primary.href(query)}
          variant="styleless"
        >
          <div style={{ width: '14px', height: '14px' }}>
            <PrimaryIcon />
          </div>
          {primary.label}
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
            {secondaryModels.map((key) => {
              const model = AI_MODELS[key]
              const Icon = model.icon
              return (
                <DropdownMenu.Item key={key} className={styles.dropdownMenuItem} asChild>
                  <a href={model.href(query)} target="_blank" rel="noopener noreferrer">
                    <div style={{ width: '14px', height: '14px' }}>
                      <Icon />
                    </div>
                    {model.label}
                  </a>
                </DropdownMenu.Item>
              )
            })}
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
