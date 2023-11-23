import { useEffect, useState } from 'react'
import { config as virtualConfig } from 'virtual:config'

export function useConfig() {
  const [config, setConfig] = useState(virtualConfig)
  useEffect(() => {
    if (import.meta.hot) import.meta.hot.on('vocs:config', setConfig)
  }, [])
  return config
}
