import type * as Config from '../../internal/config.js'

export function resolveMcpUrl(mcp: Config.Config['mcp'], origin: string) {
  return mcp?.url || `${origin}/api/mcp`
}
