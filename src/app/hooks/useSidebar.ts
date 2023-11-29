import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import type { SidebarItem } from '../../config.js'
import { useConfig } from './useConfig.js'

export function useSidebar(): SidebarItem[] {
  const { pathname } = useLocation()
  const config = useConfig()
  const { sidebar } = config

  if (!sidebar) return []
  if (Array.isArray(sidebar)) return sidebar

  const sidebarKey = useMemo(() => {
    const keys = Object.keys(sidebar).filter((key) => pathname.startsWith(key))
    return keys[keys.length - 1]
  }, [sidebar, pathname])
  if (!sidebarKey) return []

  return sidebar[sidebarKey]
}
