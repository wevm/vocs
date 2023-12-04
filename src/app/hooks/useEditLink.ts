import { useMemo } from 'react'

import { useConfig } from './useConfig.js'
import { usePageData } from './usePageData.js'

export function useEditLink() {
  const pageData = usePageData()
  const config = useConfig()

  return useMemo(() => {
    const { pattern = '', text = 'Edit page' } = config.editLink ?? {}

    let url = ''
    // TODO: pattern as function
    if (typeof pattern === 'function') url = ''
    else if (pageData.filePath) url = pattern.replace(/:path/g, pageData.filePath)

    return { url, text }
  }, [config.editLink, pageData.filePath])
}
