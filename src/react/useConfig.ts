'use client'

import { config as initialConfig } from 'virtual:vocs/client-config'
import { useEffect, useState } from 'react'
import type * as ClientConfig from '../internal/client-config.js'
import * as ConfigSerializer from '../internal/config-serializer.js'

export function useConfig(): ClientConfig.ClientConfig {
  const [config, setConfig] = useState(ConfigSerializer.deserializeFunctions(initialConfig))

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ClientConfig.ClientConfig>
      setConfig(ConfigSerializer.deserializeFunctions(customEvent.detail))
    }
    globalThis.addEventListener('vocs:config', handler)
    return () => globalThis.removeEventListener('vocs:config', handler)
  }, [])

  return config
}
