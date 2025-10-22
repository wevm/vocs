import { useMemo } from 'react'
import { useLocation } from 'react-router'

import type { SidebarItem } from '../../config.js'
import { useConfig } from './useConfig.js'

type UseSidebarReturnType = { backLink?: boolean; items: SidebarItem[]; key?: string }

export function useSidebar(): UseSidebarReturnType {
  const { pathname } = useLocation()
  const config = useConfig()
  const { sidebar } = config

  const sidebarKey = useMemo(() => {
    if (!sidebar) return undefined
    const keys = Object.keys(sidebar).filter((key) => pathname.startsWith(key))
    return keys[keys.length - 1]
  }, [sidebar, pathname])

  if (!sidebar) return { items: [] }
  if (Array.isArray(sidebar)) return { items: sidebar }
  if (!sidebarKey) return { items: [] }
  if (Array.isArray(sidebar[sidebarKey]))
    return { key: sidebarKey, items: sidebar[sidebarKey] } as UseSidebarReturnType
  return { ...sidebar[sidebarKey], key: sidebarKey } as UseSidebarReturnType
}
