'use client'

import * as React from 'react'
import LucideCheck from '~icons/lucide/check'
import LucideKeyRound from '~icons/lucide/key-round'
import type { IrSecurityScheme } from '../../../internal/openapi/parser.js'
import * as Auth from './auth.js'

/**
 * Global authentication control for an OpenAPI section.
 *
 * Renders a compact button (typically top-right of a page header) that opens a
 * popover where the consumer enters their credentials once. The values persist
 * to `localStorage` (see {@link file://./auth.js}) and are read back by the
 * {@link file://./Playground.client.tsx playground provider} so every "Try"
 * request across the section is pre-authenticated — even though this panel
 * itself renders on pages (Introduction / domain overview) that don't mount the
 * playground modal.
 *
 * Only `apiKey` and `http` (bearer/basic) schemes are surfaced; `oauth2` /
 * `openIdConnect` are left to the in-modal flow.
 */
export function Authentication(props: Authentication.Props) {
  const { mount, schemes } = props

  // Keep only the schemes we can render a simple field set for.
  const entries = React.useMemo(
    () =>
      Object.entries(schemes ?? {})
        .map(([name, scheme]) => ({ name, scheme, kind: Auth.authKind(scheme) }))
        .filter((entry): entry is Entry => entry.kind !== null),
    [schemes],
  )

  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState<Auth.AuthValues>({})
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Hydrate from storage on mount (client-only, avoids SSR mismatch) and keep in
  // sync with writes from other instances of this panel / other tabs.
  React.useEffect(() => {
    setValues(Auth.read(mount))
    return Auth.subscribe(mount, () => setValues(Auth.read(mount)))
  }, [mount])

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (entries.length === 0) return null

  const configured = entries.some((entry) => Auth.isFilled(values[entry.name]))

  function update(name: string, patch: Partial<Auth.AuthValue>) {
    setValues((prev) => {
      const next: Auth.AuthValues = { ...prev, [name]: { ...prev[name], ...patch } }
      Auth.write(mount, next)
      return next
    })
  }

  function clearAll() {
    setValues({})
    Auth.write(mount, {})
  }

  return (
    <div ref={rootRef} data-v-openapi-auth>
      <button
        type="button"
        data-v-openapi-action
        data-v-openapi-auth-trigger
        data-configured={configured || undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <LucideKeyRound data-v-openapi-action-icon />
        Authentication
        {configured ? <span data-v-openapi-auth-dot aria-hidden /> : null}
      </button>

      {open ? (
        <div data-v-openapi-auth-panel role="dialog" aria-label="Authentication">
          <div data-v-openapi-auth-panel-header>
            <span data-v-openapi-auth-panel-title>Authentication</span>
            {configured ? (
              <button type="button" data-v-openapi-auth-clear onClick={clearAll}>
                Clear
              </button>
            ) : null}
          </div>
          <p data-v-openapi-auth-hint>
            Credentials are stored in your browser and applied to every “Try” request.
          </p>
          <div data-v-openapi-auth-fields>
            {entries.map((entry) => (
              <Field
                key={entry.name}
                entry={entry}
                value={values[entry.name]}
                onChange={(patch) => update(entry.name, patch)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export declare namespace Authentication {
  type Props = {
    /** Spec mount path (storage scope, e.g. `/api`). */
    mount: string
    /** Named security schemes from the spec (`components.securitySchemes`). */
    schemes: Record<string, IrSecurityScheme>
  }
}

type Entry = {
  name: string
  scheme: IrSecurityScheme
  kind: Auth.AuthKind
}

function Field(props: {
  entry: Entry
  value: Auth.AuthValue | undefined
  onChange: (patch: Partial<Auth.AuthValue>) => void
}) {
  const { entry, value, onChange } = props
  const label = schemeLabel(entry)
  const description =
    typeof entry.scheme.description === 'string' ? entry.scheme.description : undefined

  return (
    <div data-v-openapi-auth-field>
      <span data-v-openapi-auth-field-label>
        {label}
        {Auth.isFilled(value) ? <LucideCheck data-v-openapi-auth-field-check aria-hidden /> : null}
      </span>
      {description ? <span data-v-openapi-auth-field-desc>{description}</span> : null}
      {entry.kind === 'basic' ? (
        <>
          <input
            data-v-openapi-auth-input
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Username"
            value={value?.username ?? ''}
            onChange={(event) => onChange({ username: event.target.value })}
          />
          <input
            data-v-openapi-auth-input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="Password"
            value={value?.password ?? ''}
            onChange={(event) => onChange({ password: event.target.value })}
          />
        </>
      ) : (
        <input
          data-v-openapi-auth-input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={tokenPlaceholder(entry)}
          value={value?.token ?? ''}
          onChange={(event) => onChange({ token: event.target.value })}
        />
      )}
    </div>
  )
}

/** Human label for a scheme: the header name for apiKey, else the scheme name. */
function schemeLabel(entry: Entry) {
  if (entry.scheme.type === 'apiKey') {
    const name = (entry.scheme as { name?: string }).name
    if (name) return name
  }
  return entry.name
}

function tokenPlaceholder(entry: Entry) {
  if (entry.scheme.type === 'apiKey') return 'API key'
  return 'Token'
}
