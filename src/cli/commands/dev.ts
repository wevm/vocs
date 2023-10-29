type DevParameters = { host?: boolean }

export async function dev(params: DevParameters = {}) {
  const { createDevServer } = await import('../../vite/dev-server.js')
  const server = await createDevServer({ host: params.host })
  await server.listen()
  server.printUrls()
}
