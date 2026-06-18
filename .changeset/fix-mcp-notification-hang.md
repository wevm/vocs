---
"vocs": patch
---

Fixed the MCP Streamable HTTP endpoint hanging on JSON-RPC notifications (e.g. `notifications/initialized`) by acking payloads that contain no requests with `202 Accepted`.
