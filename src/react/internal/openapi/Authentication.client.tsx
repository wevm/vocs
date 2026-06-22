'use client'

import * as React from 'react'
import type { IrSecurityScheme } from '../../../internal/openapi/parser.js'
import * as Auth from './auth.js'

/**
 * Global authentication control for an OpenAPI section.
 *
 * A small card with a title/description and a single labeled API key input,
 * rendered inline below a page header. The key persists to `localStorage` (see
 * {@link file://./auth.js}) and is read back by the
 * {@link file://./Playground.client.tsx playground provider} so every "Try"
 * request across the section is pre-authenticated — even on pages (Introduction
 * / domain overview) that don't mount the playground modal.
 *
 * Intentionally opinionated: one token, sent as a bearer credential (falling
 * back to an apiKey scheme). Renders nothing when the spec exposes no scheme a
 * single token can drive.
 */
export function Authentication(props: Authentication.Props) {
  const { mount, schemes } = props

  const primary = React.useMemo(() => Auth.primaryScheme(schemes), [schemes])
  const [token, setToken] = React.useState('')

  // Hydrate from storage on mount (client-only, avoids SSR mismatch) and keep in
  // sync with writes from other instances of this panel / other tabs.
  React.useEffect(() => {
    setToken(Auth.read(mount))
    return Auth.subscribe(mount, () => setToken(Auth.read(mount)))
  }, [mount])

  if (!primary) return null

  function update(next: string) {
    setToken(next)
    Auth.write(mount, next)
  }

  return (
    <section data-v-openapi-auth aria-label="Authentication">
      <div data-v-openapi-auth-header>
        <span data-v-openapi-auth-title>Authentication</span>
        <p data-v-openapi-auth-description>
          Stored in your browser and applied to every “Try” request.
        </p>
      </div>
      <label data-v-openapi-auth-field>
        <span data-v-openapi-auth-label>API Key</span>
        <input
          data-v-openapi-auth-input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter your API key"
          value={token}
          onChange={(event) => update(event.target.value)}
        />
      </label>
    </section>
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
