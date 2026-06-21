/// <reference types="vite/client" />

// Vite-only asset module. These specifiers (`?url`, `?arraybuffer`) are Vite
// transforms, so this file is loaded indirectly via `import.meta.glob` in
// `handlers.ts` rather than imported directly. That keeps non-Vite bundlers
// (esbuild/Wrangler) from following these asset imports when they only import
// the `vocs/server` barrel for `Handler.openApi`.

export { ImageResponse } from '@takumi-rs/image-response/wasm'

import wasm from '@takumi-rs/wasm/takumi_wasm_bg.wasm?url'
import font from './fonts/geist.woff2?arraybuffer'

export { font, wasm }
