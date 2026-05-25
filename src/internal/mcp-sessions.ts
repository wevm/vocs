import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { WebSSEServerTransport, WebStreamableHTTPServerTransport } from './mcp-transport.js'

type Transport = WebSSEServerTransport | WebStreamableHTTPServerTransport

export type Session = {
  transport: Transport
  server: McpServer
}

/**
 * In-memory session store for MCP connections.
 * Maps session IDs to their transport and server instances.
 */
export const sessions = new Map<string, Session>()

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId)
}

export function setSession(sessionId: string, session: Session): void {
  sessions.set(sessionId, session)
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId)
}

export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId)
}
