import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  isJSONRPCRequest,
  type JSONRPCMessage,
  type JSONRPCNotification,
  type JSONRPCRequest,
} from '@modelcontextprotocol/sdk/types.js'
import { describe, expect, it } from 'vitest'
import { WebStreamableHTTPServerTransport } from './mcp-transport.js'

const notification: JSONRPCNotification = {
  jsonrpc: '2.0',
  method: 'notifications/initialized',
}

function request(id: number, method: string): JSONRPCRequest {
  return { jsonrpc: '2.0', id, method }
}

function replyOnRequest(transport: WebStreamableHTTPServerTransport) {
  transport.onmessage = (message) => {
    if (isJSONRPCRequest(message)) transport.send({ jsonrpc: '2.0', id: message.id, result: {} })
  }
}

describe('WebStreamableHTTPServerTransport', () => {
  it('acks a notification with 202 without hanging', async () => {
    const transport = new WebStreamableHTTPServerTransport()
    const received: JSONRPCMessage[] = []
    transport.onmessage = (message) => received.push(message)

    const response = await transport.handleRequest(notification)

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
    expect(received).toEqual([notification])
  })

  it('acks a batch of only notifications with 202', async () => {
    const transport = new WebStreamableHTTPServerTransport()
    const received: JSONRPCMessage[] = []
    transport.onmessage = (message) => received.push(message)

    const response = await transport.handleRequest([notification, notification])

    expect(response.status).toBe(202)
    expect(received).toHaveLength(2)
  })

  it('streams an SSE response for a request', async () => {
    const transport = new WebStreamableHTTPServerTransport()
    replyOnRequest(transport)

    const response = await transport.handleRequest(request(1, 'tools/list'), true)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    expect(await response.text()).toContain('"id":1')
  })

  it('resolves a JSON response for a request', async () => {
    const transport = new WebStreamableHTTPServerTransport()
    replyOnRequest(transport)

    const response = await transport.handleRequest(request(1, 'tools/list'), false)

    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ jsonrpc: '2.0', id: 1, result: {} })
  })

  it('still replies to a request mixed into a notification batch', async () => {
    const transport = new WebStreamableHTTPServerTransport()
    const received: JSONRPCMessage[] = []
    transport.onmessage = (message) => {
      received.push(message)
      if (isJSONRPCRequest(message)) transport.send({ jsonrpc: '2.0', id: message.id, result: {} })
    }

    const response = await transport.handleRequest([notification, request(1, 'tools/list')], false)

    expect(await response.json()).toEqual({ jsonrpc: '2.0', id: 1, result: {} })
    expect(received).toHaveLength(2)
  })

  it('assigns a session id on initialize and echoes it on the ack', async () => {
    const transport = new WebStreamableHTTPServerTransport({
      sessionIdGenerator: () => 'session-1',
    })
    replyOnRequest(transport)

    await transport.handleRequest(request(1, 'initialize'), false)
    expect(transport.sessionId).toBe('session-1')

    const ack = await transport.handleRequest(notification)
    expect(ack.status).toBe(202)
    expect(ack.headers.get('mcp-session-id')).toBe('session-1')
  })
})

describe('WebStreamableHTTPServerTransport with a real McpServer', () => {
  it('does not hang on `notifications/initialized` (#484)', async () => {
    const transport = new WebStreamableHTTPServerTransport({
      sessionIdGenerator: () => 'session-1',
    })
    const server = new McpServer({ name: 'test', version: '1.0.0' })
    await server.connect(transport as never)

    const init = await transport.handleRequest(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'repro', version: '0.1.0' },
        },
      },
      false,
    )
    const initBody = await init.json()
    expect(initBody.id).toBe(1)
    expect(initBody.result).toBeDefined()

    // The server never replies to this notification, so the transport must ack
    // it itself. Awaiting the JSON-mode promise would hang forever otherwise.
    const ack = await transport.handleRequest(notification, false)
    expect(ack.status).toBe(202)

    await server.close()
  })
})
