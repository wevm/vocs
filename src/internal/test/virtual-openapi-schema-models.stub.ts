import type { SchemaModel } from '../openapi/schema-model.js'

export const schemaModelDocuments: Record<string, () => Promise<Record<string, SchemaModel>>> = {}
