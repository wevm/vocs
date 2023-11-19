import pc from 'picocolors'
import { createLogger } from 'vite'
import { version } from '../version.js'

export async function preview() {
  const { preview } = await import('../../vite/preview.js')
  const server = await preview()

  const logger = createLogger()
  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.green('[running]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}`)
  logger.info('')
  server.printUrls()
}
