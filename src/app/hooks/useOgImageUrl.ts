import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useConfig } from './useConfig.js'

export function useOgImageUrl(): string | undefined {
  const { pathname } = useLocation()
  const config = useConfig()
  const { ogImageUrl } = config

  if (!ogImageUrl) return undefined
  if (typeof ogImageUrl === 'string') return ogImageUrl

  const pathKey = useMemo(() => {
    const keys = Object.keys(ogImageUrl).filter((key) => pathname.startsWith(key))
    return keys[keys.length - 1]
  }, [ogImageUrl, pathname])
  if (!pathKey) return undefined

  return ogImageUrl[pathKey]
}
