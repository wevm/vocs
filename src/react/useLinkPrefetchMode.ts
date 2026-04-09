'use client'

import * as LinkPrefetch from '../internal/link-prefetch.js'
import { useConfig } from './useConfig.js'
import { useSidebar } from './useSidebar.js'

export function useLinkPrefetchMode(
  options: useLinkPrefetchMode.Options = {},
): useLinkPrefetchMode.ReturnType {
  const { mode, scope = 'default' } = options

  const { linkPrefetch } = useConfig()
  const sidebar = useSidebar()

  return LinkPrefetch.resolve({
    config: linkPrefetch,
    fallbackMode: import.meta.env.DEV ? false : 'enter',
    mode,
    routeConfig: sidebar.linkPrefetch,
    scope,
  })
}

export declare namespace useLinkPrefetchMode {
  type Options = {
    mode?: LinkPrefetch.Input | undefined
    scope?: LinkPrefetch.Scope | undefined
  }

  type ReturnType = LinkPrefetch.Mode
}
