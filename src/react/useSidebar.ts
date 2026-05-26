import { useMemo } from 'react'
import { useRouter } from 'waku'
import * as Sidebar from '../internal/sidebar.js'
import { useConfig } from './useConfig.js'

export function useSidebar(): Sidebar.Sidebar {
  const { path } = useRouter()
  const config = useConfig()

  return useMemo(() => Sidebar.fromConfig(config.sidebar, path), [config.sidebar, path])
}
