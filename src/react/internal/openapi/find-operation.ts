import { slug } from '../../../internal/openapi/anchors.js'
import type { Ir, IrOperation } from '../../../internal/openapi/parser.js'

/**
 * Locates a single operation within a parsed {@link Ir}, by either its
 * `operationId` (matched against the operation's anchor id — the slugified
 * `operationId` from the spec) or an exact `method` + `path` pair.
 *
 * Shared by the public `<OpenApi.Operation />` component so the matching logic
 * stays free of the `virtual:vocs/openapi` module and is unit-testable.
 */
export function findOperation(ir: Ir, target: findOperation.Target): IrOperation | undefined {
  const operations = ir.groups.flatMap((group) => group.operations)

  if (target.operationId) {
    const id = slug(target.operationId)
    return operations.find(
      (operation) => operation.id === target.operationId || operation.id === id,
    )
  }

  if (target.method && target.path) {
    const method = target.method.toUpperCase()
    return operations.find(
      (operation) => operation.method === method && operation.path === target.path,
    )
  }

  return undefined
}

export declare namespace findOperation {
  type Target = {
    operationId?: string | undefined
    method?: string | undefined
    path?: string | undefined
  }
}
