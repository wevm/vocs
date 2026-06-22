'use client'

import LucidePlus from '~icons/lucide/plus'
import LucideX from '~icons/lucide/x'
import { Disclosure } from './Disclosure.client.js'

/**
 * Collapses nested schema properties (e.g. `error.details`) behind a toggle,
 * matching the "Show/Hide Child Attributes" pattern from Scalar/Stripe.
 * Built on the shared {@link Disclosure} accordion. The wrapping
 * `data-v-openapi-collapse` element scopes the trigger/panel styling (see
 * `openapi.css`); the Show/Hide icons and labels swap on the trigger's Base UI
 * `data-panel-open` state.
 */
export function CollapsibleChildren(props: CollapsibleChildren.Props) {
  const { children, label = 'Child Attributes' } = props
  return (
    <div data-v-openapi-collapse>
      <Disclosure
        trigger={
          <>
            <LucidePlus data-v-openapi-collapse-icon-show />
            <LucideX data-v-openapi-collapse-icon-hide />
            <span data-v-openapi-collapse-label-show>Show {label}</span>
            <span data-v-openapi-collapse-label-hide>Hide {label}</span>
          </>
        }
      >
        {children}
      </Disclosure>
    </div>
  )
}

export declare namespace CollapsibleChildren {
  type Props = {
    children: React.ReactNode
    /** Text after the Show/Hide verb. @default 'Child Attributes' */
    label?: string | undefined
  }
}
