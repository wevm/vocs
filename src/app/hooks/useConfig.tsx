import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import type { ParsedConfig } from '../../config.js'
import { config as virtualConfig } from 'virtual:config'

const ConfigContext = createContext(virtualConfig)

export const configHash = import.meta.env.DEV
  ? bytesToHex(sha256(JSON.stringify(virtualConfig))).slice(0, 8)
  : ''

export function getConfig(): ParsedConfig {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const storedConfig = window.localStorage.getItem(`vocs.config.${configHash}`)
    if (storedConfig) return JSON.parse(storedConfig)
  }
  return virtualConfig
}

export function ConfigProvider({
  children,
  config: initialConfig,
}: { children: ReactNode; config?: ParsedConfig }) {
  const [config, setConfig] = useState(() => {
    if (initialConfig) return initialConfig
    return getConfig()
  })

  useEffect(() => {
    if (import.meta.hot) import.meta.hot.on('vocs:config', setConfig)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV)
      window.localStorage.setItem(`vocs.config.${configHash}`, JSON.stringify(config))
  }, [config])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
