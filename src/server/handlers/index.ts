import type * as http from 'node:http'
import { createRequest, createRequestListener, sendResponse } from '@remix-run/node-fetch-server'

export type Handler = {
  fetch: (request: Request) => Promise<Response>
  listener: http.RequestListener
  handle: (req: http.IncomingMessage, res: http.ServerResponse) => Promise<Response | undefined>
}

export function create(fetch: Handler['fetch']): Handler {
  return {
    fetch,
    listener: createRequestListener(fetch),
    handle: async (req, res) => {
      const response = await fetch(createRequest(req, res)).catch(() => undefined)
      if (!response) return undefined
      await sendResponse(res, response)
      return response
    },
  }
}

export type ExportedHandler = {
  fetch: (request: Request) => Promise<Response>
}
