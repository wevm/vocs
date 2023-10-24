export async function preview() {
  const { preview } = await import('../../vite/preview.js')
  const server = await preview()
  server.printUrls()
}
