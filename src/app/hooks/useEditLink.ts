import { useMemo } from 'react'

import { useConfig } from './useConfig.js'
import { usePageData } from './usePageData.js'

export function useEditLink() {
  const { filePath } = usePageData()
  const config = useConfig()

  return useMemo(() => {
    const { pattern = '', text = 'Edit page' } = config.editLink ?? {}

    let url: string
    // TODO: pattern as function
    if (typeof pattern === 'function') url = ''
    else url = pattern.replace(/:path/g, filePath)

    return { url, text }
  }, [config.editLink, filePath])
}
