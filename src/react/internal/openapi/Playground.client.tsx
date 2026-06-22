'use client'

// Scalar's stylesheet, loaded with this client-only chunk (i.e. only on
// OpenAPI pages). It is largely unlayered, so it outranks Vocs's layered
// Tailwind and styles the modal without further layer wiring. During SSR this
// import is a no-op. A static import is used because Vite reliably injects CSS
// for static client imports, unlike dynamic `import('*.css')`.
import '@scalar/api-client/style.css'
// Maps Scalar's theme variables onto Vocs tokens (loaded after Scalar's CSS so
// the overrides win). Lives under `src/styles` so the build emits it to
// `dist/styles` (zile only copies CSS assets reachable from the `./styles/*`
// export glob; a colocated `./playground.css` would not be emitted).
import '../../../styles/openapi-playground.css'
import * as React from 'react'
import { createPortal } from 'react-dom'
import LucidePlay from '~icons/lucide/play'
import type { Ir, IrSecurityScheme } from '../../../internal/openapi/parser.js'
import { useColorScheme } from '../../useColorScheme.js'
import * as Auth from './auth.js'

type OpenFn = (operation: { method: string; path: string; example?: string | undefined }) => void

const PlaygroundContext = React.createContext<{ open: OpenFn; ready: boolean } | null>(null)

/**
 * Mounts the Scalar API client modal once per spec and exposes an `open`
 * function to its descendants. The modal is a Vue app loaded lazily on the
 * client only (Scalar is untested under SSR), so nothing is imported during
 * server rendering.
 */
export function PlaygroundProvider(props: PlaygroundProvider.Props) {
  const { client, children, mount: specMount = '/', schemes } = props
  const containerRef = React.useRef<HTMLDivElement>(null)
  // biome-ignore lint/suspicious/noExplicitAny: Scalar's modal type lives in a client-only module.
  const modalRef = React.useRef<any>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    // biome-ignore lint/suspicious/noExplicitAny: client-only Scalar app instance.
    let modal: any = null

    async function mount() {
      try {
        const [{ createWorkspaceStore }, { createApiClientModal }] = await Promise.all([
          import('@scalar/workspace-store/client'),
          import('@scalar/api-client/modal'),
        ])

        const store = createWorkspaceStore()
        await store.addDocument({
          name: 'default',
          ...('url' in client ? { url: client.url } : { document: client.content }),
        })
        if (cancelled) return

        modal = createApiClientModal({
          el: containerRef.current,
          workspaceStore: store,
          // Seed the global auth the consumer entered in the Authentication panel
          // (persisted in localStorage) so every "Try" request is pre-authed.
          options: authOptions(specMount, schemes),
        })
        modalRef.current = modal
        setReady(true)
      } catch (error) {
        // Surface load failures without breaking the docs page.
        console.error('[vocs] Failed to initialize the OpenAPI playground.', error)
      }
    }

    mount()
    return () => {
      cancelled = true
      try {
        modal?.app?.unmount()
      } catch {}
      modalRef.current = null
    }
  }, [client, specMount, schemes])

  // Re-apply auth whenever the consumer updates credentials in the panel while
  // this page is mounted (no need to reopen the modal to pick up the change).
  React.useEffect(
    () =>
      Auth.subscribe(specMount, () => {
        modalRef.current?.updateOptions(authOptions(specMount, schemes))
      }),
    [specMount, schemes],
  )

  const open = React.useCallback<OpenFn>((operation) => {
    modalRef.current?.open({
      method: operation.method.toLowerCase(),
      path: operation.path,
      // Preselect the JSON-RPC method's request example (expanded OpenRPC
      // operations all share one path + verb, so the example disambiguates).
      ...(operation.example ? { example: operation.example } : {}),
    })
  }, [])

  const value = React.useMemo(() => ({ open, ready }), [open, ready])

  // Render the Scalar host at `document.body` (client-only) so it sits outside
  // Vocs's layout: a transformed/contained ancestor would otherwise break the
  // modal's `position: fixed` overlay.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Scalar's `--scalar-*` theme variables are defined under `.light-mode` /
  // `.dark-mode`; without one of those classes every `var(--scalar-*)` resolves
  // to nothing. Mirror Vocs's active color scheme onto the host.
  const colorScheme = useColorScheme()

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          // Scalar scopes ~all of its CSS under `.scalar-app`/`.scalar-client`,
          // so everything it renders must live inside an element with those
          // classes. The dialog teleports (via @headlessui/vue) into
          // `#headlessui-portal-root`; pre-creating that node here — inside the
          // Scalar scope — makes Headless UI reuse it instead of appending a
          // bare node to `<body>`, so the dialog inherits Scalar's styles.
          <div
            className={`scalar-app scalar-client ${colorScheme === 'dark' ? 'dark-mode' : 'light-mode'}`}
            data-v-openapi-playground-root
          >
            <div ref={containerRef} />
            <div id="headlessui-portal-root" />
          </div>,
          document.body,
        )}
    </PlaygroundContext.Provider>
  )
}

export declare namespace PlaygroundProvider {
  type Props = {
    client: Ir['client']
    children: React.ReactNode
    /** Spec mount path; scopes the persisted global auth (e.g. `/api`). */
    mount?: string | undefined
    /** Named security schemes from the spec, used to shape auth secrets. */
    schemes?: Record<string, IrSecurityScheme> | undefined
  }
}

/**
 * Builds Scalar's `authentication` client options from the consumer's persisted
 * global credentials so pre-selected security schemes resolve a token without
 * opening the modal's auth UI.
 *
 * This is Scalar's documented preset API (`authentication.securitySchemes`
 * override values keyed by scheme name + `preferredSecurityScheme` to pick the
 * active one). Per-type value keys: apiKey → `value`, http `bearer` → `token`,
 * http `basic` → `username`/`password`.
 */
function authOptions(mount: string, schemes: Record<string, IrSecurityScheme> | undefined) {
  // biome-ignore lint/suspicious/noExplicitAny: Scalar's override-value shape is loosely typed.
  const securitySchemes: Record<string, any> = {}
  const preferred: string[] = []

  const values = Auth.read(mount)
  for (const [name, scheme] of Object.entries(schemes ?? {})) {
    const kind = Auth.authKind(scheme)
    if (!kind) continue
    const value = values[name]
    if (kind === 'basic') {
      if (!value?.username && !value?.password) continue
      securitySchemes[name] = { username: value.username ?? '', password: value.password ?? '' }
      preferred.push(name)
    } else {
      if (!value?.token) continue
      // apiKey overrides via `value`; http (bearer) via `token`.
      securitySchemes[name] =
        scheme.type === 'apiKey' ? { value: value.token } : { token: value.token }
      preferred.push(name)
    }
  }

  return {
    authentication: {
      securitySchemes,
      // Select a configured scheme so its value is actually applied to requests.
      ...(preferred.length > 0 ? { preferredSecurityScheme: preferred[0] } : {}),
    },
  }
}

/**
 * Button that opens the Scalar API client modal for a single operation. Renders
 * a disabled placeholder until the modal finishes loading on the client.
 */
export function TestRequestButton(props: TestRequestButton.Props) {
  const { method, path, example } = props
  const context = React.useContext(PlaygroundContext)

  return (
    <button
      type="button"
      data-v-openapi-action
      data-v-openapi-test-request
      disabled={!context?.ready}
      onClick={() => context?.open({ method, path, example })}
    >
      <LucidePlay data-v-openapi-action-icon />
      Try
    </button>
  )
}

export declare namespace TestRequestButton {
  type Props = {
    method: string
    path: string
    /** Name of the request example to preselect (JSON-RPC method name). */
    example?: string | undefined
  }
}
