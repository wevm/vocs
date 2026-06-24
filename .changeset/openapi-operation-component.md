---
"vocs": minor
---

Added `<OpenApi.Operation />` and `<OpenApi.Playground />` components for embedding OpenAPI endpoints inline in authored MDX pages. `<OpenApi.Operation />` renders the full operation block (title, parameters, responses, and the interactive sample); `<OpenApi.Playground />` renders just the request/response code sample box (Copy, "Try", and per-status tabs). Target an operation by `operationId` or by `method` + `path`. Both accept `anchors={false}` to disable the clickable schema cross-links and `hideQueryParams` to omit query parameters from the request sample.
