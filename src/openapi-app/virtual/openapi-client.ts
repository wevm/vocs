import type { Ir } from '../../internal/openapi/parser.js'
import { read } from '../payload.js'

const payload = read()

/** Backs the lazy playground client document in the prebuilt app. */
export const clients: Record<string, () => Promise<Ir['client']>> = {
  [payload.ir.path || '/']: async () => payload.ir.client,
}
