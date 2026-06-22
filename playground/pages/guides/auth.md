---
title: Authentication
---

# Authentication

All requests to the Tempo API require an API key passed in the
`Authorization` header.

## Getting a key

Create a key from your dashboard, then send it as a Bearer token:

```bash
curl https://cadent.tempo.xyz/v1/blocks \
  -H "Authorization: Bearer $TEMPO_API_KEY"
```

## Rate limits

Requests are limited per key. When you exceed the limit you'll receive a
`429 Too Many Requests` response.
