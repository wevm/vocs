import { config as virtualConfig } from 'virtual:config'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { deserializeConfig, type ParsedConfig, serializeConfig } from '../../config.js'

const ConfigContext = createContext(virtualConfig)

function getConfigHash(config: ParsedConfig): string {
  return import.meta.env.DEV ? bytesToHex(sha256(serializeConfig(config))).slice(0, 8) : ''
}

export function getConfig(): ParsedConfig {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const hash = getConfigHash(virtualConfig)
    const storedConfig = window.localStorage.getItem(`vocs.config.${hash}`)
    if (storedConfig) return deserializeConfig(storedConfig)
  }
  return virtualConfig
}

export function ConfigProvider({
  children,
  config: initialConfig,
}: {
  children: ReactNode
  config?: ParsedConfig
}) {
  const [config, setConfig] = useState(() => {
    if (initialConfig) return initialConfig
    return getConfig()
  })

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('vocs:config', (newConfig) => {
        try {
          // check first that we received a config object
          if (!newConfig || typeof newConfig !== 'object') {
            console.error('Received invalid config update:', newConfig)
            return
          }

          setConfig(newConfig)

          // clear any error overlay if config update succeeded
          if (import.meta.hot) import.meta.hot.send('vocs:config-updated')
        } catch (error) {
          console.error('Failed to apply config update:', error)
          // Keep using current config on error
        }
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      try {
        const hash = getConfigHash(config)
        window.localStorage.setItem(`vocs.config.${hash}`, serializeConfig(config))
      } catch (error) {
        console.error('Failed to cache config in localStorage:', error)
        // Continue without caching - not critical
      }
    }
  }, [config])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
