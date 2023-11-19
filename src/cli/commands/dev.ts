import pc from 'picocolors'
import { createLogger } from 'vite'
import { version } from '../version.js'

type DevParameters = { host?: boolean }

export async function dev(_: any, { host }: DevParameters = {}) {
  const { createDevServer } = await import('../../vite/dev-server.js')

  const server = await createDevServer({ host })
  await server.listen()

  const logger = createLogger()
  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.green('[running]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}`)
  logger.info('')
  server.printUrls()
}
