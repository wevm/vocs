---
"vocs": patch
---

Fixed the standalone OpenAPI reference rendering blank (`__webpack_require__ is not defined`). The genuine `react/Link` imports `unstable_RouterContext` from `waku/router/client`, which dragged `react-server-dom-webpack` into the prebuilt browser bundle. The standalone build now aliases `waku/router/client` to its Waku shim (which provides the router context), keeping the RSC client out of the bundle.
