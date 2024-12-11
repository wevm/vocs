import { useMemo } from 'react'

import { useLocation } from 'react-router-dom'
import { useConfig } from './useConfig.js'
import { usePageData } from './usePageData.js'

export function useEditLink() {
  const pageData = usePageData()
  const config = useConfig()
  const { pathname } = useLocation()

  let pathKey = ''
  if (typeof config?.title === 'object' && Object.keys(config?.title ?? {}).length > 0) {
    let keys: string[] = []
    keys = Object.keys(config?.title).filter((key) => pathname.startsWith(key))
    pathKey = keys[keys.length - 1]
  }

  const configEditLink = !config.editLink?.pattern
    ? (config?.editLink as any)?.[pathKey]
    : config.editLink

  return useMemo(() => {
    const { pattern = '', text = 'Edit page' } = configEditLink ?? {}

    let url = ''
    // TODO: pattern as function
    if (typeof pattern === 'function') url = ''
    else if (pageData.filePath) url = pattern.replace(/:path/g, pageData.filePath)

    return { url, text }
  }, [configEditLink, pageData.filePath])
}
