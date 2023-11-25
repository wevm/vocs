import { useEffect, useState } from 'react'
import { docgen as virtualDocgen } from 'virtual:docgen'

export function useDocgen() {
  const [docgen, setDocgen] = useState(virtualDocgen)
  useEffect(() => {
    if (import.meta.hot) import.meta.hot.on('vocs:docgen', setDocgen)
  }, [])
  return docgen
}
