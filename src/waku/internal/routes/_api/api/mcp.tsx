import * as Config from '../../../../../internal/config.js'
import * as Mcp from '../../../../../internal/mcp.js'
import * as McpSessions from '../../../../../internal/mcp-sessions.js'
import {
  WebSSEServerTransport,
  WebStreamableHTTPServerTransport,
} from '../../../../../internal/mcp-transport.js'

/**
 * GET /api/mcp - Establish SSE stream (deprecated HTTP+SSE transport)
 *
 * This endpoint establishes an SSE connection and sends an `endpoint` event
 * with the URL for the client to POST messages to.
 */
export async function GET() {
  const config = await Config.resolve({ server: true })

  if (!config.mcp?.enabled) {
    return Response.json({ error: 'MCP not enabled' }, { status: 404 })
  }

  const transport = new WebSSEServerTransport('/api/mcp/messages')
  const server = Mcp.createServer(config)

  McpSessions.setSession(transport.sessionId, { transport, server })

  transport.onclose = () => {
    McpSessions.deleteSession(transport.sessionId)
  }

  await server.connect(transport as never)

  return transport.createResponse()
}

/**
 * POST /api/mcp - Handle MCP JSON-RPC messages (Streamable HTTP transport)
 *
 * Accepts JSON-RPC requests and returns either:
 * - `Content-Type: text/event-stream` for SSE streaming
 * - `Content-Type: application/json` for single JSON response
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })

  if (!config.mcp?.enabled) {
    return Response.json({ error: 'MCP not enabled' }, { status: 404 })
  }

  const sessionId = request.headers.get('mcp-session-id')
  const accept = request.headers.get('accept') || ''
  const useSSE = accept.includes('text/event-stream')

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

  if (sessionId && McpSessions.hasSession(sessionId)) {
    const session = McpSessions.getSession(sessionId)
    if (!session) throw new Error('Session disappeared unexpectedly')
    if ('handlePostMessage' in session.transport) {
      return (session.transport as WebSSEServerTransport).handlePostMessage(body)
    }
    return (session.transport as WebStreamableHTTPServerTransport).handleRequest(body, useSSE)
  }

  const isInitialize =
    typeof body === 'object' && body !== null && 'method' in body && body.method === 'initialize'

  if (!sessionId && !isInitialize) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Session not found' }, id: null },
      { status: 400 },
    )
  }

  const transport = new WebStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      McpSessions.setSession(id, { transport, server })
    },
  })

  const server = Mcp.createServer(config)
  await server.connect(transport as never)

  return transport.handleRequest(body, useSSE)
}

/**
 * DELETE /api/mcp - Terminate session (Streamable HTTP transport)
 */
export async function DELETE(request: Request) {
  const sessionId = request.headers.get('mcp-session-id')

  if (!sessionId || !McpSessions.hasSession(sessionId)) {
    return new Response('Session not found', { status: 400 })
  }

  const session = McpSessions.getSession(sessionId)
  if (!session) return new Response('Session not found', { status: 400 })
  const { transport, server } = session
  McpSessions.deleteSession(sessionId)

  await transport.close()
  await server.close()

  return new Response(null, { status: 204 })
}
