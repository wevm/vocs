import type { CAC } from 'cac'

export function cli_preview(cli: CAC) {
  return cli
}

export async function preview() {
  const { preview } = await import('../../vite/preview.js')
  const server = await preview()
  server.printUrls()
}
