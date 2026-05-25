export type Method = (typeof METHODS)[number]
export type ApiHandler = (req: Request) => Promise<Response>
export type ApiDefaultHandler = ApiHandler | { fetch: ApiHandler }
export type ApiRouteModule = Record<string, unknown> &
  Partial<Record<Method, ApiHandler>> & {
    default?: unknown
    getConfig?: () => Promise<{
      render?: 'static' | 'dynamic'
    }>
  }

export const METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
] as const

function isMethod(exportName: string): exportName is Method {
  return METHODS.includes(exportName as Method)
}

function warnInvalidApiExport(path: string, exportName: string) {
  console.warn(
    `API ${path} has an invalid export: ${exportName}. Valid exports are: ${METHODS.join(', ')}`,
  )
}

function isInvalidDynamicApiExport(exportName: string, value: unknown) {
  if (exportName === 'getConfig' || exportName === 'default' || isMethod(exportName)) return false
  return typeof value === 'function'
}

export function hasInvalidStaticApiExports(mod: ApiRouteModule) {
  return Object.entries(mod).some(([exportName, value]) => {
    if (exportName === 'getConfig' || exportName === 'GET') return false
    if (exportName === 'default') return true
    return typeof value === 'function'
  })
}

export function getApiHandlers(mod: ApiRouteModule, path: string) {
  const handlers: Record<string, ApiDefaultHandler> = {}

  if (mod.default) handlers['all'] = mod.default as ApiDefaultHandler
  for (const method of METHODS) {
    const handler = mod[method]
    if (handler) handlers[method] = handler
  }

  for (const [exportName, value] of Object.entries(mod))
    if (isInvalidDynamicApiExport(exportName, value)) warnInvalidApiExport(path, exportName)

  return handlers
}
