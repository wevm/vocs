import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPIV3 } from 'openapi-types'

import type { SidebarItem } from './sidebar.js'

export type Operation = {
  operationId: string
  method: string
  path: string
  summary?: string
  description?: string
  tags: string[]
  parameters: OpenAPIV3.ParameterObject[]
  requestBody?: OpenAPIV3.RequestBodyObject
  responses: Record<string, OpenAPIV3.ResponseObject>
  deprecated?: boolean
}

/** Load and dereference an OpenAPI spec from a URL or file path. */
export async function loadSpec(options: loadSpec.Options): Promise<OpenAPIV3.Document> {
  const api = await SwaggerParser.dereference(options.spec)
  return api as OpenAPIV3.Document
}

export declare namespace loadSpec {
  type Options = {
    /** URL or file path to the OpenAPI spec. */
    spec: string
  }
}

/** Extract all operations from a parsed OpenAPI spec. */
export function extractOperations(doc: OpenAPIV3.Document): Operation[] {
  const operations: Operation[] = []
  const paths = doc.paths ?? {}

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue

    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const
    for (const method of methods) {
      const operation = pathItem[method]
      if (!operation) continue

      const op: Operation = {
        operationId:
          operation.operationId ?? `${method}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
        method,
        path,
        tags: operation.tags ?? [],
        parameters: (operation.parameters ?? []) as OpenAPIV3.ParameterObject[],
        responses: (operation.responses ?? {}) as Record<string, OpenAPIV3.ResponseObject>,
      }
      if (operation.summary) op.summary = operation.summary
      if (operation.description) op.description = operation.description
      if (operation.requestBody)
        op.requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject
      if (operation.deprecated) op.deprecated = operation.deprecated
      operations.push(op)
    }
  }

  return operations
}

/** Group operations by tag and build sidebar items. */
export function buildSidebarItems(
  operations: Operation[],
  basePath: string,
): SidebarItem[] {
  const groups = new Map<string, Operation[]>()

  for (const operation of operations) {
    const tag = operation.tags[0] ?? 'Other'
    const existing = groups.get(tag)
    if (existing) existing.push(operation)
    else groups.set(tag, [operation])
  }

  const items: SidebarItem[] = []
  for (const [tag, ops] of groups) {
    const tagSlug = getTagSlug(tag)
    items.push({
      text: tag,
      collapsed: true,
      items: ops.map((op) => ({
        text: op.summary ?? op.operationId,
        link: `${basePath}/${tagSlug}/${getOperationSlug(op)}`,
      })),
    })
  }

  return items
}

/** Generate a URL slug for an operation. */
export function getOperationSlug(operation: Pick<Operation, 'operationId' | 'method' | 'path'>): string {
  if (operation.operationId) return toKebabCase(operation.operationId)
  return toKebabCase(`${operation.method}-${operation.path}`)
}

/** Generate a URL slug for a tag name. */
export function getTagSlug(tag: string): string {
  return toKebabCase(tag)
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/{}]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
