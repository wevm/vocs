import { cloneElement, type ReactNode } from 'react'

import { Steps as Steps_ } from '../Steps.js'
import { Step } from '../Step.js'
import * as stepStyles from '../Step.css.js'

export function Steps({ children }: { children: ReactNode }) {
  if (!Array.isArray(children)) return null
  return (
    <Steps_>
      {children.map(({ props }, i) => {
        const [title, ...children] = props.children
        return (
          <Step
            key={i}
            title={cloneElement(title, { className: stepStyles.title })}
          >
            {children}
          </Step>
        )
      })}
    </Steps_>
  )
}
