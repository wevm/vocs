import type { CAC } from 'cac'

export function cli_dev(cli: CAC) {
  return cli
}

export async function dev() {
  const { createDevServer } = await import('../../vite/dev-server.js')
  const server = await createDevServer()
  await server.listen()
  server.printUrls()
}
