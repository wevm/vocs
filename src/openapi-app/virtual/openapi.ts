import type { Ir } from '../../internal/openapi/parser.js'
import { read } from '../payload.js'

const payload = read()

/**
 * Backs `virtual:vocs/openapi` in the prebuilt app: the single parsed spec keyed
 * by its mount base (matching the site integration's `specs` map).
 */
export const specs: Record<string, Ir> = { [payload.ir.path || '/']: payload.ir }
