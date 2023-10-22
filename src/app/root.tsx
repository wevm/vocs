import { type ReactNode } from 'react'
import { useApplyCssTransition } from './hooks/useApplyCssTransition.js'
import { Root as AppRoot } from 'virtual:root'

export function Root({ children }: { children: ReactNode }) {
  useApplyCssTransition()
  return (
    <AppRoot>
      <div className="vocs">{children}</div>
    </AppRoot>
  )
}
