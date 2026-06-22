'use client'

import { Accordion } from '@base-ui/react/accordion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { registerDisclosure } from './anchor-navigation.client.js'

/**
 * A single collapsible disclosure built on the Base UI Accordion primitive,
 * used for the toggleable sections across OpenAPI pages (nested "child
 * attributes", responses, etc.). Collapsed by default.
 *
 * The panel is kept mounted so its content is always present in the DOM; this
 * lets {@link revealAnchor} scroll to a property inside a collapsed disclosure
 * (e.g. when clicking a response example line). The disclosure registers its
 * panel + an `open()` callback so navigation can reveal it on demand.
 *
 * The trigger is a plain node so it can be passed from server components.
 * Styling is attached via stable data attributes — `data-v-openapi-disclosure`,
 * `-disclosure-trigger`, `-disclosure-panel` — which consumers scope by
 * ancestor (e.g. `[data-v-openapi-response] [data-v-openapi-disclosure-trigger]`)
 * so no Tailwind classes are passed through props. Open-state styling is driven
 * via the Base UI `data-panel-open` attribute on the trigger.
 */
export function Disclosure(props: Disclosure.Props) {
  const { trigger, defaultOpen = false, children } = props
  const [value, setValue] = useState<string[]>(defaultOpen ? ['disclosure'] : [])
  const panelRef = useRef<HTMLDivElement | null>(null)

  const open = useCallback(() => {
    setValue((current) => (current.includes('disclosure') ? current : ['disclosure']))
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    return registerDisclosure(panel, open)
  }, [open])

  return (
    <Accordion.Root
      data-v-openapi-disclosure
      value={value}
      onValueChange={(next) => setValue(next as string[])}
      multiple
      keepMounted
    >
      <Accordion.Item value="disclosure">
        <Accordion.Header data-v-openapi-disclosure-header>
          <Accordion.Trigger data-v-openapi-disclosure-trigger>{trigger}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel ref={panelRef} data-v-openapi-disclosure-panel>
          {children}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  )
}

export declare namespace Disclosure {
  type Props = {
    /** Content of the trigger button. Style open state via `data-panel-open`. */
    trigger: React.ReactNode
    /** @default false */
    defaultOpen?: boolean | undefined
    children: React.ReactNode
  }
}
