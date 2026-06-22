'use client'

import { useState } from 'react'
import LucidePlus from '~icons/lucide/plus'
import LucideX from '~icons/lucide/x'

const previewCount = 5

/**
 * Renders a schema's enum literals as a vertical "values" list (one per row)
 * rather than a wrapping inline union. Shows the first {@link previewCount}
 * values and reveals the rest behind a "Show all values" toggle, matching the
 * Scalar/Stripe reference UI.
 */
export function EnumValues(props: EnumValues.Props) {
  const { values } = props
  const [expanded, setExpanded] = useState(false)
  const hasMore = values.length > previewCount
  const visible = expanded ? values : values.slice(0, previewCount)
  return (
    <div data-v-openapi-values>
      <span data-v-openapi-values-label>Values</span>
      <div data-v-openapi-values-list>
        {visible.map((value) => (
          <code key={value} data-v-openapi-values-item>
            {value}
          </code>
        ))}
      </div>
      {hasMore && (
        <button type="button" onClick={() => setExpanded((value) => !value)} data-v-openapi-pill>
          {expanded ? (
            <LucideX data-v-openapi-pill-icon />
          ) : (
            <LucidePlus data-v-openapi-pill-icon />
          )}
          {expanded ? 'Hide values' : 'Show all values'}
        </button>
      )}
    </div>
  )
}

export declare namespace EnumValues {
  type Props = {
    /** Enum literal values as display strings. */
    values: string[]
  }
}
