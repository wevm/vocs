export function indexHtml(params: { importMap: string }) {
  const { importMap } = params

  return /* html */ `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vocs Sandbox</title>
      <script type="importmap">
        ${importMap}
      </script>
    </head>
    <body>
      <main id="root">Loading...</main>
      <script src="./index.js" type="module"></script>
    </body>
    </html>`
}
