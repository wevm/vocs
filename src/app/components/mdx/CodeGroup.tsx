import { type ReactElement, useEffect, useState } from 'react'

import * as Tabs from '../Tabs.js'
import * as styles from './CodeGroup.css.js'

const STORAGE_KEY = 'codegroup-selected-tab'

export function CodeGroup({ children }: { children: ReactElement[] }) {
  if (!Array.isArray(children)) return null

  const tabs = children.map((child_: any) => {
    const child = child_.props['data-title'] ? child_ : child_.props.children
    const { props } = child
    const title = (props as { 'data-title'?: string })['data-title'] as string
    const content = props.children as ReactElement
    return { title, content }
  })

  const tabValues = tabs.map((tab) => tab.title || '').filter(Boolean)
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]?.title || '')

  // Load from localStorage on mount and set up listener
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && tabValues.includes(stored)) {
          setSelectedTab(stored)
        }
      } catch (error) {
        // Handle localStorage access errors (e.g., in SSR or private browsing)
        console.warn('Could not access localStorage for code group tab:', error)
      }
    }

    // Load initial value
    loadFromStorage()

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && tabValues.includes(e.newValue)) {
        setSelectedTab(e.newValue)
      }
    }

    // Listen for custom storage events from same page
    const handleCustomStorageChange = (e: CustomEvent) => {
      const newValue = e.detail.value
      if (newValue && tabValues.includes(newValue)) {
        setSelectedTab(newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('codegroup-storage-change', handleCustomStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(
        'codegroup-storage-change',
        handleCustomStorageChange as EventListener,
      )
    }
  }, [tabValues])

  const handleTabChange = (value: string) => {
    setSelectedTab(value)

    try {
      localStorage.setItem(STORAGE_KEY, value)
      // Dispatch custom event for same-page synchronization
      window.dispatchEvent(
        new CustomEvent('codegroup-storage-change', {
          detail: { value },
        }),
      )
    } catch (error) {
      console.warn('Could not save code group tab to localStorage:', error)
    }
  }

  return (
    <Tabs.Root className={styles.root} value={selectedTab} onValueChange={handleTabChange}>
      <Tabs.List aria-label="Code group">
        {tabs.map(({ title }, i) => (
          <Tabs.Trigger key={title || i.toString()} value={title || i.toString()}>
            {title}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map(({ title, content }: any, i) => {
        const isShiki = content.props?.children?.props?.className?.includes('shiki')
        return (
          <Tabs.Content
            key={title || i.toString()}
            data-shiki={isShiki}
            value={title || i.toString()}
          >
            {content}
          </Tabs.Content>
        )
      })}
    </Tabs.Root>
  )
}
