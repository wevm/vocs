import type { CAC } from 'cac'

type DevParameters = { host?: boolean }

export function cli_dev(cli: CAC) {
  return cli.option('-h, --host', 'Expose host URL')
}

export async function dev(params: DevParameters = {}) {
  console.log(params)
  const { createDevServer } = await import('../../vite/dev-server.js')
  const server = await createDevServer({ host: params.host })
  await server.listen()
  server.printUrls()
}
