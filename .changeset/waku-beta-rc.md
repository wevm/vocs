---
"vocs": major
"create-vocs": patch
"@vocs/twoslash-rust": minor
"@vocs/twoslash-rust-darwin-arm64": minor
"@vocs/twoslash-rust-linux-x64-gnu": minor
---

TODO

Notes for consumers upgrading from `pkg.pr` to `rc`:

- Updated Waku and Vite peer versions.

```diff
- waku: ^1.0.0-alpha.x
- vite: ^7
+ waku: ^1.0.0-beta.0
+ vite: ^8
```

- Limited API route module exports to HTTP handlers and `getConfig`.

```diff
- export const client = createClient({ ... })
- export const schema = z.object({ ... })
+ export async function GET(request: Request) { ... }
+ export async function POST(request: Request) { ... }
+ export async function OPTIONS(request: Request) { ... }
+ export function getConfig() { ... }
```
