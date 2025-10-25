import pm from 'picomatch'
import { useMemo } from 'react'
import { useLocation } from 'react-router'

import { useConfig } from './useConfig.js'

export function useOgImageUrl(): string | undefined {
  const { pathname } = useLocation()
  const config = useConfig()
  const { ogImageUrl } = config

  const pathKey = useMemo(() => {
    if (!ogImageUrl) return undefined
    if (typeof ogImageUrl === 'string') return undefined
    const keys = Object.keys(ogImageUrl).filter(
      (key) => pathname.startsWith(key) || pm(key)(pathname),
    )
    return keys[keys.length - 1]
  }, [ogImageUrl, pathname])
  if (!pathKey) return undefined

  if (!ogImageUrl) return undefined
  if (typeof ogImageUrl === 'string') return ogImageUrl
  return ogImageUrl[pathKey]
}
