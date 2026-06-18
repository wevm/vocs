import { randomUUID } from 'node:crypto'
import { isJSONRPCRequest, type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

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
    if (!this._writer) return new Response('SSE connection not established', { status: 500 })

    try {
      this.onmessage?.(body as JSONRPCMessage)
      return new Response('Accepted', { status: 202 })
    } catch (error) {
      this.onerror?.(error as Error)
      return new Response(`Invalid message: ${String(error)}`, { status: 400 })
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._writer) throw new Error('Not connected')
    await this._write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
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
    const messages = Array.isArray(body) ? (body as JSONRPCMessage[]) : [body as JSONRPCMessage]

    const isInitialize = messages.some(
      (message) => 'method' in message && message.method === 'initialize',
    )
    if (!this.sessionId && isInitialize) {
      this.sessionId = this._options.sessionIdGenerator?.() ?? randomUUID()
      this._options.onsessioninitialized?.(this.sessionId)
    }

    // Notifications/responses get no JSON-RPC reply -- ack with 202 instead of hanging.
    if (!messages.some(isJSONRPCRequest)) {
      for (const message of messages) this.onmessage?.(message)
      return new Response(null, {
        status: 202,
        headers: this.sessionId ? { 'mcp-session-id': this.sessionId } : {},
      })
    }

    if (useSSE) {
      const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
      this._responseWriter = writable.getWriter()

      this._pendingResponse = async (response) => {
        await this._write(`event: message\ndata: ${JSON.stringify(response)}\n\n`)
        try {
          await this._responseWriter?.close()
        } catch {}
      }

      for (const message of messages) this.onmessage?.(message)

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          ...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
        },
      })
    }

    return new Promise((resolve) => {
      this._pendingResponse = (response) => {
        resolve(
          Response.json(response, {
            headers: this.sessionId ? { 'mcp-session-id': this.sessionId } : {},
          }),
        )
      }
      for (const message of messages) this.onmessage?.(message)
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
