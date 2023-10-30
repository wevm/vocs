import type { ReactNode } from 'react'

import { Steps as Steps_ } from '../Steps.js'
import { Step } from '../Step.js'

export function Steps({ children }: { children: ReactNode }) {
  if (!Array.isArray(children)) return null
  return (
    <Steps_>
      {children.map(({ props }, i) => {
        const [title, ...children] = props.children
        return (
          <Step
            key={i}
            title={title.props.children}
            titleLevel={parseInt(props['data-depth']) as any}
          >
            {children}
          </Step>
        )
      })}
    </Steps_>
  )
}
