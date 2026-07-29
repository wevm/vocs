import type { SchemaModel } from '../../internal/openapi/schema-model.js'

// The standalone app keeps schema models inline because its payload is already
// delivered as one external asset. Generated Vite routes replace this manifest
// with code-split category documents.
export const schemaModelDocuments: Record<string, () => Promise<Record<string, SchemaModel>>> = {}
