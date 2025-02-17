import pc from 'picocolors'
import { createLogger } from 'vite'
import { version } from '../version.js'

type DevParameters = { clean?: boolean; clearScreen?: boolean; host?: boolean; port?: number }

export async function dev(_: any, { clean, clearScreen = true, host, port }: DevParameters = {}) {
  const { createDevServer } = await import('../../vite/devServer.js')

  const server = await createDevServer({ clean, host, port })
  await server.listen()

  const logger = createLogger()
  if (clearScreen) logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.green('[running]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}`)
  logger.info('')
  server.printUrls()
}
