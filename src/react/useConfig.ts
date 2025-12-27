'use client'

import { config as initialConfig } from 'virtual:vocs/config'
import { useEffect, useState } from 'react'

import type * as Config from '../internal/config.js'

export function useConfig() {
  const [config, setConfig] = useState(initialConfig)

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<Config.Config>
      setConfig(customEvent.detail)
    }
    globalThis.addEventListener('vocs:config', handler)
    return () => globalThis.removeEventListener('vocs:config', handler)
  }, [])

  return config
}
