import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import type { ParsedConfig } from '../../config.js'
import { config as virtualConfig } from 'virtual:config'

const ConfigContext = createContext(virtualConfig)

const configHash = import.meta.env.DEV
  ? bytesToHex(sha256(JSON.stringify(virtualConfig))).slice(0, 8)
  : ''

export function ConfigProvider({
  children,
  config: initialConfig,
}: { children: ReactNode; config?: ParsedConfig }) {
  const [config, setConfig] = useState<ParsedConfig>(() => {
    if (initialConfig) return initialConfig
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      const storedConfig = window.localStorage.getItem(`vocs.config.${configHash}`)
      if (storedConfig) return JSON.parse(storedConfig)
    }
    return virtualConfig
  })

  useEffect(() => {
    if (import.meta.hot) import.meta.hot.on('vocs:config', setConfig)
  }, [])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
