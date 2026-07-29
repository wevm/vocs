'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import LucidePlay from '~icons/lucide/play'
import { useColorScheme } from '../../useColorScheme.js'
import * as Auth from './auth.js'

type OpenFn = (operation: { method: string; path: string; example?: string | undefined }) => void

const PlaygroundContext = React.createContext<{ open: OpenFn; loading: boolean } | null>(null)

/**
 * Mounts the Scalar API client modal once per spec and exposes an `open`
 * function to its descendants. The modal is a Vue app loaded lazily on the
 * client only (Scalar is untested under SSR), so nothing is imported during
 * server rendering.
 */
export function PlaygroundProvider(props: PlaygroundProvider.Props) {
  const { children, mount: specMount = '/' } = props
  const containerRef = React.useRef<HTMLDivElement>(null)
  // biome-ignore lint/suspicious/noExplicitAny: Scalar's modal type lives in a client-only module.
  const modalRef = React.useRef<any>(null)
  // The Scalar workspace store backing the modal; kept so cross-page auth
  // updates can be loaded into the live store without reopening the modal.
  // biome-ignore lint/suspicious/noExplicitAny: client-only Scalar store instance.
  const storeRef = React.useRef<any>(null)
  const initializeRef = React.useRef<Promise<unknown> | null>(null)
  const generationRef = React.useRef(0)
  const [loading, setLoading] = React.useState(false)

  // Scalar's document, code, and CSS chunks load only after the first "Try"
  // click. Cleanup still follows the provider across route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a mount change must dispose the previous Scalar instance
  React.useEffect(() => {
    return () => {
      generationRef.current += 1
      setLoading(false)
      try {
        modalRef.current?.app?.unmount()
      } catch {}
      modalRef.current = null
      storeRef.current = null
      initializeRef.current = null
    }
  }, [specMount])

  // When another playground instance (another page/tab) persists new
  // credentials, load them into this live store so its "Try" stays in sync
  // without reopening the modal.
  React.useEffect(
    () =>
      Auth.subscribe(specMount, () => {
        const store = storeRef.current
        if (store) loadStoredAuth(store, specMount)
      }),
    [specMount],
  )

  const initialize = React.useCallback(async () => {
    if (modalRef.current) return modalRef.current
    if (initializeRef.current) return initializeRef.current

    const generation = generationRef.current
    setLoading(true)
    const pending = Promise.all([
      import('./playground-modal.client.js'),
      import('virtual:vocs/openapi-client'),
    ])
      .then(async ([{ createWorkspaceStore, createApiClientModal }, { clients }]) => {
        const loadClient = clients[specMount]
        if (!loadClient) throw new Error(`No OpenAPI spec is mounted at ${specMount}.`)
        const client = await loadClient()
        if (generation !== generationRef.current) return null

        const store = createWorkspaceStore({
          plugins: [
            {
              hooks: {
                onWorkspaceStateChanges(event) {
                  if (event.type !== 'auth') return
                  const next = serializeAuth(store)
                  if (next === Auth.read(specMount)) return
                  Auth.write(specMount, next)
                },
              },
            },
          ],
        })
        await store.addDocument({
          name: 'default',
          ...('url' in client ? { url: client.url } : { document: client.content }),
        })
        if (generation !== generationRef.current) return null

        storeRef.current = store
        loadStoredAuth(store, specMount)
        const modal = createApiClientModal({
          el: containerRef.current,
          workspaceStore: store,
        })
        modalRef.current = modal
        return modal
      })
      .catch((error) => {
        if (generation === generationRef.current) initializeRef.current = null
        console.error('[vocs] Failed to initialize the OpenAPI playground.', error)
        return null
      })
      .finally(() => {
        if (generation === generationRef.current) setLoading(false)
      })
    initializeRef.current = pending
    return pending
  }, [specMount])

  const open = React.useCallback<OpenFn>(
    (operation) => {
      void initialize().then((modal) =>
        modal?.open({
          method: operation.method.toLowerCase(),
          path: operation.path,
          // Preselect the JSON-RPC method's request example (expanded OpenRPC
          // operations all share one path + verb, so the example disambiguates).
          ...(operation.example ? { example: operation.example } : {}),
        }),
      )
    },
    [initialize],
  )

  const value = React.useMemo(() => ({ open, loading }), [open, loading])

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
    children: React.ReactNode
    /** Spec mount path; scopes the persisted auth (e.g. `/api`). */
    mount?: string | undefined
  }
}

/**
 * Serializes Scalar's exported auth state to a JSON string for persistence,
 * or `null` when the store holds no credentials.
 */
// biome-ignore lint/suspicious/noExplicitAny: client-only Scalar store instance.
function serializeAuth(store: any): string | null {
  try {
    const data = store.auth.export()
    return data && Object.keys(data).length > 0 ? JSON.stringify(data) : null
  } catch {
    return null
  }
}

/**
 * Loads the persisted auth blob for a mount into a Scalar store. Skips the load
 * when the store already matches what's stored, so the change `auth.load()`
 * fires doesn't churn or feed back into a persist loop.
 */
// biome-ignore lint/suspicious/noExplicitAny: client-only Scalar store instance.
function loadStoredAuth(store: any, mount: string): void {
  const saved = Auth.read(mount)
  if (!saved || saved === serializeAuth(store)) return
  try {
    store.auth.load(JSON.parse(saved))
  } catch {}
}

/**
 * Button that opens the Scalar API client modal for a single operation. The
 * first click loads the modal; later clicks reuse the mounted instance.
 */
export function TestRequestButton(props: TestRequestButton.Props) {
  const { method, path, example } = props
  const context = React.useContext(PlaygroundContext)

  return (
    <button
      type="button"
      data-v-openapi-action
      data-v-openapi-test-request
      disabled={!context || context.loading}
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
