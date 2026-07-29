import type { Ir } from '../openapi/parser.js'

export const clients: Record<string, () => Promise<Ir['client']>> = {}
