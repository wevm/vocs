import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import type { ParsedConfig } from '../../config.js'
import { config as virtualConfig } from 'virtual:config'

const ConfigContext = createContext(virtualConfig)

export function ConfigProvider({
  children,
  config: initialConfig,
}: { children: ReactNode; config?: ParsedConfig }) {
  const [config, setConfig] = useState(() => {
    if (initialConfig) return initialConfig
    if (typeof window !== 'undefined') {
      const storedConfig = window.localStorage.getItem('vocsConfig')
      if (storedConfig) return JSON.parse(storedConfig)
    }
    return virtualConfig
  })

  useEffect(() => {
    if (import.meta.hot) import.meta.hot.on('vocs:config', setConfig)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined')
      window.localStorage.setItem('vocsConfig', JSON.stringify(config))
  }, [config])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
