import { type ReactNode, cloneElement } from 'react'

import * as stepStyles from '../Step.css.js'
import { Step } from '../Step.js'
import { Steps as Steps_ } from '../Steps.js'

export function Steps({ children }: { children: ReactNode }) {
  if (!Array.isArray(children)) return null
  return (
    <Steps_>
      {children.map(({ props }, i) => {
        const [title, ...children] = Array.isArray(props.children)
          ? props.children
          : [props.children]
        return (
          <Step key={i} title={cloneElement(title, { className: stepStyles.title })}>
            {children}
          </Step>
        )
      })}
    </Steps_>
  )
}
