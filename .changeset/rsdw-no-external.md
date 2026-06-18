---
"vocs": patch
---

Fixed `vocs dev` crashing on fresh npm/bun installs with a missing `react-server` condition error by keeping `react-server-dom-webpack` bundled in the RSC server environments.
