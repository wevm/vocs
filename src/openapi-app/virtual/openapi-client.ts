import type { Ir } from '../../internal/openapi/parser.js'
import { read } from '../payload.js'

const payload = read()

/** Backs the lazy playground client document in the prebuilt app. */
export const clients: Record<string, Ir['client']> = {
  [payload.ir.path || '/']: payload.ir.client,
}
