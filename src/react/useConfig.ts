'use client'

import { config as initialConfig } from 'virtual:vocs/config'
import { useEffect, useState } from 'react'
import type * as Config from '../internal/config.js'
import * as ConfigSerializer from '../internal/config-serializer.js'

export function useConfig(): Config.Config {
  const [config, setConfig] = useState(ConfigSerializer.deserializeFunctions(initialConfig))

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<Config.Config>
      setConfig(ConfigSerializer.deserializeFunctions(customEvent.detail))
    }
    globalThis.addEventListener('vocs:config', handler)
    return () => globalThis.removeEventListener('vocs:config', handler)
  }, [])

  return config
}
