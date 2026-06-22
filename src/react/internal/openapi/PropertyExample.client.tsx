'use client'

import { useSyncExternalStore } from 'react'
import {
  hasSampleLine,
  revealSampleLine,
  subscribeSampleAnchors,
} from './anchor-navigation.client.js'

/**
 * A schema/parameter example value. When the sibling code sample renders a line
 * for the same property — a response example line, or a request sample path/
 * query parameter — the value becomes clickable and reveals (switching response
 * tabs / expanding collapsed query params if needed) and flashes that right-hand
 * line: the reverse of clicking a sample line to jump to this row.
 */
export function PropertyExample(props: PropertyExample.Props) {
  const { id, value } = props

  // Re-evaluate once the sibling `CodeSample` mounts and registers its anchors,
  // so the affordance appears even though both mount around the same time.
  const clickable = useSyncExternalStore(
    subscribeSampleAnchors,
    () => Boolean(id) && hasSampleLine(id as string),
    () => false,
  )

  return (
    <div data-v-openapi-property-example data-clickable={clickable || undefined}>
      <span data-v-openapi-property-example-label>Example</span>
      {clickable ? (
        <button
          type="button"
          data-v-openapi-property-example-value
          onClick={() => {
            void revealSampleLine(id as string)
          }}
        >
          {value}
        </button>
      ) : (
        <span data-v-openapi-property-example-value>{value}</span>
      )}
    </div>
  )
}

export declare namespace PropertyExample {
  type Props = {
    /** The property/parameter row's anchor id, matched against sample lines. */
    id?: string | undefined
    /** Example value display string. */
    value: string
  }
}
