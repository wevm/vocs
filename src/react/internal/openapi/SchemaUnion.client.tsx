'use client'

import { useEffect, useRef, useState } from 'react'
import LucideChevronDown from '~icons/lucide/chevron-down'
import { registerDisclosure } from './anchor-navigation.client.js'

/**
 * Renders a `oneOf`/`anyOf` schema union as a variant picker (in the style of
 * Scalar's "Any of …" selector) instead of a long `a | b | c` type string.
 * The dropdown switches which variant's schema is shown below it.
 *
 * All variant panels are kept mounted (only the selected one is visible) so a
 * property inside an unselected variant is still present in the DOM. Each panel
 * registers itself with the navigation registry so {@link revealAnchor} can
 * select the variant containing a target before scrolling to it — letting a
 * response example line expand the union as deep as needed.
 *
 * Styling lives in `openapi.css` keyed on the `data-v-openapi-union*` attributes.
 */
export function SchemaUnion(props: SchemaUnion.Props) {
  const { kind, names, panels } = props
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div data-v-openapi-union>
      <div data-v-openapi-union-head>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          data-v-openapi-union-trigger
        >
          <span data-v-openapi-union-kind>{kind}</span>
          {selected === null ? (
            <span data-v-openapi-union-value>Select a value</span>
          ) : (
            <span data-v-openapi-union-value>{names[selected]}</span>
          )}
          <LucideChevronDown data-v-openapi-union-chevron />
        </button>
        {open && (
          <>
            <button
              type="button"
              aria-label="Close"
              tabIndex={-1}
              data-v-openapi-dropdown-backdrop
              onClick={() => setOpen(false)}
            />
            <ul data-v-openapi-union-menu>
              {names.map((name, index) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(index)
                      setOpen(false)
                    }}
                    data-v-openapi-union-option
                    data-selected={index === selected || undefined}
                  >
                    <span data-v-openapi-union-radio>
                      {index === selected && <span data-v-openapi-union-radio-dot />}
                    </span>
                    <span data-v-openapi-union-option-label>{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {panels.map((panel, index) => (
        <VariantPanelSlot
          // biome-ignore lint/suspicious/noArrayIndexKey: panels are static and never reordered
          key={index}
          visible={index === selected}
          onReveal={() => setSelected(index)}
        >
          {panel}
        </VariantPanelSlot>
      ))}
    </div>
  )
}

/**
 * Wraps a single variant panel: always mounted (so its contents are navigable)
 * but only laid out when selected. Registers the panel so navigating to an
 * anchor inside it selects this variant.
 */
function VariantPanelSlot(props: {
  visible: boolean
  onReveal: () => void
  children: React.ReactNode
}) {
  const { visible, onReveal, children } = props
  const ref = useRef<HTMLDivElement | null>(null)
  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal

  useEffect(() => {
    const panel = ref.current
    if (!panel) return
    return registerDisclosure(panel, () => onRevealRef.current())
  }, [])

  return (
    <div ref={ref} hidden={!visible} data-v-openapi-union-panel data-visible={visible || undefined}>
      {children}
    </div>
  )
}

export declare namespace SchemaUnion {
  type Props = {
    /** Leading label, e.g. `Any of` or `One of`. */
    kind: string
    /** Display name for each variant. */
    names: string[]
    /** Server-rendered schema panel for each variant. */
    panels: React.ReactNode[]
  }
}
