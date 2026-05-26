'use client'

import {
  type unstable_AdapterInterface,
  unstable_createAdapterProvider,
} from 'nuqs/adapters/custom'
import * as React from 'react'

function useNuqsWakuAdapter(): unstable_AdapterInterface {
  const [searchParams, setSearchParams] = React.useState(() => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  })

  React.useEffect(() => {
    const onPopState = () => setSearchParams(new URLSearchParams(window.location.search))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateUrl = React.useCallback(
    (search: URLSearchParams, options: { history: 'push' | 'replace'; scroll: boolean }) => {
      const url = new URL(window.location.href)
      url.search = search.toString()

      if (options.history === 'push') window.history.pushState(null, '', url.toString())
      else window.history.replaceState(null, '', url.toString())

      setSearchParams(new URLSearchParams(search))

      if (options.scroll) window.scrollTo(0, 0)
    },
    [],
  )

  return {
    searchParams,
    updateUrl,
  }
}

export const NuqsAdapter: React.FC<{ children: React.ReactNode }> =
  unstable_createAdapterProvider(useNuqsWakuAdapter)
