import { type ReactNode } from 'react'
import { useApplyCssTransition } from './hooks/useApplyCssTransition.js'

export function Main({ children }: { children: ReactNode }) {
  useApplyCssTransition()
  return (
    <div className="vocs">
      <article>{children}</article>
    </div>
  )
}
