import { type ReactNode } from 'react'
import { useApplyCssTransition } from './hooks/useApplyCssTransition.js'

export function Root({ children }: { children: ReactNode }) {
  useApplyCssTransition()
  return <div className="vocs">{children}</div>
}
