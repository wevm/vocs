import pc from 'picocolors'
import { createLogger } from 'vite'
import { version } from '../version.js'

type DevParameters = { host?: boolean; port?: number }

export async function dev(_: any, { host, port }: DevParameters = {}) {
  const { createDevServer } = await import('../../vite/devServer.js')

  const server = await createDevServer({ host, port })
  await server.listen()

  const logger = createLogger()
  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.green('[running]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}`)
  logger.info('')
  server.printUrls()
}
