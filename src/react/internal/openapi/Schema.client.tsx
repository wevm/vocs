'use client'

import { Fragment, useEffect, useLayoutEffect, useState } from 'react'
import LucideChevronDown from '~icons/lucide/chevron-down'
import { type SchemaPath, schemaPropertyId } from '../../../internal/openapi/anchors.js'
import { unionVariantSegment } from '../../../internal/openapi/union.js'
import { Badge } from '../../Badge.js'
import { registerLazyAnchor } from './anchor-navigation.client.js'
import { CollapsibleChildren } from './CollapsibleChildren.client.js'
import { EnumValues } from './EnumValues.client.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { PropertyExample } from './PropertyExample.client.js'
import type { SchemaModel, SchemaPropertyModel, SchemaVariantModel } from './Schema.js'

/**
 * Renders a compact schema display model. Only the visible property level is
 * server-rendered; collapsed children and unselected union variants materialize
 * after interaction.
 */
export function SchemaView(props: SchemaView.Props) {
  const { idBase } = props
  const [targetId, setTargetId] = useState<string>()

  useEffect(() => {
    if (!idBase) return
    return registerLazyAnchor({
      has: (id) => id.startsWith(`${idBase}-`),
      reveal: setTargetId,
    })
  }, [idBase])

  // Descendant disclosures persist the forced-open state during their layout
  // effects, so the temporary target can be cleared after the reveal commits.
  useEffect(() => {
    if (!targetId) return
    const timeout = window.setTimeout(() => setTargetId(undefined), 100)
    return () => window.clearTimeout(timeout)
  }, [targetId])

  return <SchemaNode {...props} targetId={targetId} />
}

export declare namespace SchemaView {
  type Props = {
    model: SchemaModel
    /** Muted ancestor path prepended to each child row's name. */
    prefix?: string | undefined
    /** Operation/media response id used to build property anchors. */
    idBase?: string | undefined
    /** Schema path leading to this model. */
    path?: SchemaPath | undefined
  }
}

function SchemaNode(
  props: SchemaView.Props & {
    targetId?: string | undefined
  },
) {
  const { model, prefix = '', idBase, path = [], targetId } = props
  if (model.view === 'union')
    return (
      <UnionView model={model} prefix={prefix} idBase={idBase} path={path} targetId={targetId} />
    )

  return (
    <div data-v-openapi-schema>
      {model.properties.map((property) => {
        const childPrefix = `${prefix}${property.name}${property.array ? '[]' : ''}.`
        const childPath = [...path, property.name]
        const id = idBase ? schemaPropertyId(idBase, childPath) : undefined
        const revealChild = Boolean(id && targetId?.startsWith(`${id}-`))
        return (
          <PropertyRow key={property.name} property={property} id={id} prefix={prefix}>
            {property.child?.view === 'union' ? (
              <UnionView
                model={property.child}
                prefix={childPrefix}
                idBase={idBase}
                path={childPath}
                targetId={targetId}
              />
            ) : property.child ? (
              <CollapsibleChildren lazy forceOpen={revealChild}>
                <div data-v-openapi-children>
                  <SchemaNode
                    model={property.child}
                    prefix={childPrefix}
                    idBase={idBase}
                    path={childPath}
                    targetId={targetId}
                  />
                </div>
              </CollapsibleChildren>
            ) : null}
          </PropertyRow>
        )
      })}
    </div>
  )
}

function PropertyRow(props: {
  property: SchemaPropertyModel
  id?: string | undefined
  prefix: string
  children?: React.ReactNode
}) {
  const { property, id, prefix, children } = props
  const inline: { key: string; node: React.ReactNode }[] = [
    ...(property.type
      ? [
          {
            key: 'type',
            node: (
              <code data-v data-v-openapi-type>
                {property.type}
              </code>
            ),
          },
        ]
      : []),
    ...property.meta.map((item) => ({
      key: item.label,
      node: (
        <span>
          <span data-v-openapi-meta-label>{item.label} </span>
          <span data-v-openapi-meta-value>{item.value}</span>
        </span>
      ),
    })),
  ]

  return (
    <div data-v-openapi-property id={id}>
      <div data-v-openapi-property-head>
        <span data-v-openapi-property-name>
          {prefix && <span data-v-openapi-property-prefix>{prefix}</span>}
          <span data-v-openapi-property-label>{property.name}</span>
        </span>
        {property.required && (
          <Badge variant="warning" data-v-openapi-property-required>
            Required
          </Badge>
        )}
        {property.deprecated && <Badge variant="note">Deprecated</Badge>}
        {id && <HeadingAnchor id={id} />}
      </div>
      {inline.length > 0 && (
        <div data-v-openapi-property-meta>
          {inline.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 && <span data-v-openapi-meta-sep>·</span>}
              {item.node}
            </Fragment>
          ))}
        </div>
      )}
      {property.descriptionHtml && (
        <div
          data-v-openapi-property-description
          data-v-content
          // biome-ignore lint/security/noDangerouslySetInnerHtml: build-rendered trusted spec content
          dangerouslySetInnerHTML={{ __html: property.descriptionHtml }}
        />
      )}
      {property.values && property.values.length > 0 && <EnumValues values={property.values} />}
      {property.example !== undefined && <PropertyExample id={id} value={property.example} />}
      {children}
    </div>
  )
}

function UnionView(props: {
  model: Extract<SchemaModel, { view: 'union' }>
  prefix: string
  idBase?: string | undefined
  path: SchemaPath
  targetId?: string | undefined
}) {
  const { model, prefix, idBase, path, targetId } = props
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const targetIndex = idBase
    ? model.variants.findIndex((_variant, index) => {
        const variantId = schemaPropertyId(idBase, [...path, unionVariantSegment(index)])
        return targetId?.startsWith(`${variantId}-`)
      })
    : -1
  const active = targetIndex >= 0 ? targetIndex : selected

  useLayoutEffect(() => {
    if (targetIndex >= 0) setSelected(targetIndex)
  }, [targetIndex])

  return (
    <div data-v-openapi-union>
      <div data-v-openapi-union-head>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          data-v-openapi-union-trigger
        >
          <span data-v-openapi-union-kind>{model.label}</span>
          {active === null ? (
            <span data-v-openapi-union-value>Select a value</span>
          ) : (
            <span data-v-openapi-union-value>{model.variants[active]?.name}</span>
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
              {model.variants.map((variant, index) => (
                <li key={variant.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(index)
                      setOpen(false)
                    }}
                    data-v-openapi-union-option
                    data-selected={index === active || undefined}
                  >
                    <span data-v-openapi-union-radio>
                      {index === active && <span data-v-openapi-union-radio-dot />}
                    </span>
                    <span data-v-openapi-union-option-label>{variant.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {active !== null && model.variants[active] ? (
        <VariantPanel
          variant={model.variants[active]}
          prefix={prefix}
          idBase={idBase}
          path={[...path, unionVariantSegment(active)]}
          targetId={targetId}
        />
      ) : null}
    </div>
  )
}

function VariantPanel(props: {
  variant: SchemaVariantModel
  prefix: string
  idBase?: string | undefined
  path: SchemaPath
  targetId?: string | undefined
}) {
  const { variant, prefix, idBase, path, targetId } = props
  return (
    <div data-v-openapi-variant>
      {variant.type && (
        <div data-v-openapi-property-meta>
          <code data-v data-v-openapi-type>
            {variant.type}
          </code>
          {variant.meta.map((item) => (
            <Fragment key={item.label}>
              <span data-v-openapi-meta-sep>·</span>
              <span>
                <span data-v-openapi-meta-label>{item.label} </span>
                <span data-v-openapi-meta-value>{item.value}</span>
              </span>
            </Fragment>
          ))}
        </div>
      )}
      {variant.descriptionHtml && (
        <div
          data-v-openapi-property-description
          data-v-content
          // biome-ignore lint/security/noDangerouslySetInnerHtml: build-rendered trusted spec content
          dangerouslySetInnerHTML={{ __html: variant.descriptionHtml }}
        />
      )}
      {variant.values && variant.values.length > 0 && <EnumValues values={variant.values} />}
      {variant.child && (
        <SchemaNode
          model={variant.child}
          prefix={prefix}
          idBase={idBase}
          path={path}
          targetId={targetId}
        />
      )}
    </div>
  )
}
