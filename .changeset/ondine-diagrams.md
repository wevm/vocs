---
"vocs": minor
---

Compile `mermaid` code blocks to inline SVG at build time with [Ondine](https://ondine.sh), and remove the client-side Mermaid renderer and the optional `mermaid` peer dependency. Pages no longer load a diagram runtime. Diagrams take their colors and font from the Vocs theme through `--ondine-*` CSS custom properties, which `_root.css` can override. `%%{init}%%` theme directives no longer change the appearance of a diagram. A diagram that fails to compile now fails the build with its file, line, and column.
