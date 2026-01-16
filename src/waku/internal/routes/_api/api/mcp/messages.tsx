import * as Config from '../../../../../../internal/config.js'
import * as McpSessions from '../../../../../../internal/mcp-sessions.js'
import type { WebSSEServerTransport } from '../../../../../../internal/mcp-transport.js'

/**
 * POST /api/mcp/messages?sessionId=<id>
 *
 * Handle JSON-RPC messages for the deprecated HTTP+SSE transport.
 * The sessionId is passed as a query parameter.
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })

  if (!config.mcp?.enabled) {
    return Response.json({ error: 'MCP not enabled' }, { status: 404 })
  }

  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId) {
    return new Response('Missing sessionId parameter', { status: 400 })
  }

  const session = McpSessions.getSession(sessionId)
  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  let body: unknown
  try {
    const text = await request.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 },
    )
  }

  return (session.transport as WebSSEServerTransport).handlePostMessage(body)
}
