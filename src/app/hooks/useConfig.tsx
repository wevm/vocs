import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import type { ParsedConfig } from '../../config.js'
import { config as virtualConfig } from 'virtual:config'
import { useMemo } from 'react'
import { getUrlWithBase, linkItemsWithBase } from '../utils/getUrlWithBase.js'


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

  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV)
      window.localStorage.setItem(`vocs.config.${configHash}`, JSON.stringify(config))
  }, [config])

  const configMemo = useMemo(() => {
    const { baseUrl, vite } = config

    const finalConfig:any = {
      ...config,
    };

    if(baseUrl) {
      finalConfig.vite = {
        ...finalConfig.vite,
        base: baseUrl
      }
    } else if(vite?.base) {
      finalConfig.baseUrl = vite.base;
    }

    const base = finalConfig.baseUrl;

    ['topNav', 'sidebar'].forEach((key) => {
      const items = finalConfig[key as keyof Pick<ParsedConfig, 'topNav' | 'sidebar'>];
      if(Array.isArray(items)) {
        finalConfig[key as 'topNav' | 'sidebar'] = linkItemsWithBase(items, base)
      }
    });

    ['iconUrl', 'logoUrl'].forEach((key) => {
      if(finalConfig[key]) {
        finalConfig[key] = getUrlWithBase(finalConfig[key], base)
      }
    });
    return finalConfig;
  }, [config])
  return <ConfigContext.Provider value={configMemo}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
