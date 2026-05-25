---
"vocs": major
"create-vocs": patch
"@vocs/twoslash-rust": minor
"@vocs/twoslash-rust-darwin-arm64": minor
"@vocs/twoslash-rust-linux-x64-gnu": minor
---

**Breaking:** Prepared the Vocs RC prerelease with Waku beta, Vite 8, stricter API route export validation, updated Waku/Vocs internal router and plugin entry points, externalized Vocs root/user/group icon stylesheets, and matching twoslash Rust package versions.

```diff
- waku: ^1.0.0-alpha.x
- vite: ^7
+ waku: ^1.0.0-beta.0
+ vite: ^8
```
