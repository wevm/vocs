import { randomUUID } from 'node:crypto'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

/**
 * SSE Server Transport for Web APIs (Request/Response).
 * Implements the deprecated HTTP+SSE transport (protocol version 2024-11-05).
 *
 * This transport:
 * 1. Accepts a GET request to establish an SSE stream
 * 2. Sends an `endpoint` event with the URL for POSTing messages
 * 3. Handles POST messages on the messages endpoint
 * 4. Sends responses back over the SSE stream
 */
export class WebSSEServerTransport {
  private _sessionId: string
  private _writer: WritableStreamDefaultWriter<Uint8Array> | undefined
  private _encoder = new TextEncoder()

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  constructor(private _messagesEndpoint: string) {
    this._sessionId = randomUUID()
  }

  get sessionId(): string {
    return this._sessionId
  }

  /**
   * Start the SSE stream. Called by McpServer.connect().
   */
  async start(): Promise<void> {}

  /**
   * Create the SSE Response to send to the client.
   * The response includes the endpoint event pointing to the messages URL.
   */
  createResponse(): Response {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    this._writer = writable.getWriter()

    const endpointUrl = `${this._messagesEndpoint}?sessionId=${this._sessionId}`
    this._write(`event: endpoint\ndata: ${endpointUrl}\n\n`)

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  }

  private async _write(data: string): Promise<void> {
    if (!this._writer) return
    try {
      await this._writer.write(this._encoder.encode(data))
    } catch (error) {
      this.onerror?.(error as Error)
    }
  }

  /**
   * Handle a POST message from the client.
   * Returns the response to send back.
   */
  async handlePostMessage(body: unknown): Promise<Response> {
    console.log('[MCP:SSE] handlePostMessage', JSON.stringify(body))
    if (!this._writer) {
      console.log('[MCP:SSE] No writer - SSE connection not established')
      return new Response('SSE connection not established', { status: 500 })
    }

    try {
      const message = body as JSONRPCMessage
      this.onmessage?.(message)
      console.log('[MCP:SSE] Message dispatched, returning 202')
      return new Response('Accepted', { status: 202 })
    } catch (error) {
      console.error('[MCP:SSE] Error handling message:', error)
      this.onerror?.(error as Error)
      return new Response(`Invalid message: ${String(error)}`, { status: 400 })
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    console.log('[MCP:SSE] send', JSON.stringify(message).slice(0, 200))
    if (!this._writer) {
      throw new Error('Not connected')
    }
    await this._write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
    console.log('[MCP:SSE] Message sent to SSE stream')
  }

  async close(): Promise<void> {
    if (this._writer) {
      try {
        await this._writer.close()
      } catch {}
      this._writer = undefined
    }
    this.onclose?.()
  }
}

/**
 * Streamable HTTP Server Transport for Web APIs.
 * Implements the modern Streamable HTTP transport (protocol version 2025-03-26+).
 *
 * This transport handles each request independently:
 * - POST requests with JSON-RPC messages
 * - Responses can be SSE streams or JSON depending on Accept header
 */
export class WebStreamableHTTPServerTransport {
  sessionId: string | undefined
  private _responseWriter: WritableStreamDefaultWriter<Uint8Array> | undefined
  private _encoder = new TextEncoder()
  private _pendingResponse: ((message: JSONRPCMessage) => void | Promise<void>) | undefined

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  constructor(
    private _options: {
      sessionIdGenerator?: (() => string) | undefined
      onsessioninitialized?: (sessionId: string) => void
    } = {},
  ) {}

  async start(): Promise<void> {}

  /**
   * Handle a POST request. Returns a Response (either SSE stream or JSON).
   */
  async handleRequest(body: unknown, useSSE = true): Promise<Response> {
    console.log('[MCP:HTTP] handleRequest', { useSSE, body: JSON.stringify(body).slice(0, 200) })
    const message = body as JSONRPCMessage

    if (!this.sessionId && 'method' in message && message.method === 'initialize') {
      this.sessionId = this._options.sessionIdGenerator?.() ?? randomUUID()
      console.log('[MCP:HTTP] Session initialized:', this.sessionId)
      this._options.onsessioninitialized?.(this.sessionId)
    }

    if (useSSE) {
      console.log('[MCP:HTTP] Using SSE response mode')
      const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
      this._responseWriter = writable.getWriter()

      this._pendingResponse = async (response) => {
        console.log(
          '[MCP:HTTP] SSE pending response received',
          JSON.stringify(response).slice(0, 200),
        )
        await this._write(`event: message\ndata: ${JSON.stringify(response)}\n\n`)
        try {
          await this._responseWriter?.close()
        } catch {}
      }

      this.onmessage?.(message)
      console.log('[MCP:HTTP] Message dispatched, returning SSE stream')

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          ...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
        },
      })
    }

    console.log('[MCP:HTTP] Using JSON response mode')
    return new Promise((resolve) => {
      this._pendingResponse = (response) => {
        console.log(
          '[MCP:HTTP] JSON pending response received',
          JSON.stringify(response).slice(0, 200),
        )
        resolve(
          Response.json(response, {
            headers: this.sessionId ? { 'mcp-session-id': this.sessionId } : {},
          }),
        )
      }
      this.onmessage?.(message)
      console.log('[MCP:HTTP] Message dispatched, waiting for response')
    })
  }

  private async _write(data: string): Promise<void> {
    if (!this._responseWriter) return
    try {
      await this._responseWriter.write(this._encoder.encode(data))
    } catch (error) {
      this.onerror?.(error as Error)
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this._pendingResponse) {
      await this._pendingResponse(message)
      this._pendingResponse = undefined
    } else if (this._responseWriter) {
      await this._write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
    }
  }

  async close(): Promise<void> {
    if (this._responseWriter) {
      try {
        await this._responseWriter.close()
      } catch {}
      this._responseWriter = undefined
    }
    this.onclose?.()
  }
}
