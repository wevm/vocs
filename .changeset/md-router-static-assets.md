---
"vocs": patch
---

Fixed multi-second latency when CLI and AI-agent user-agents request static assets (`.json`, `.svg`, etc.) by skipping markdown twin resolution for non-page requests.
