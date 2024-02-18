import pc from 'picocolors'
import { createLogger } from 'vite'

import { resolveVocsConfig } from '../../vite/utils/resolveVocsConfig.js'
import { version } from '../version.js'

export async function preview() {
  const { preview } = await import('../../vite/preview.js')
  const server = await preview()

  const { config } = await resolveVocsConfig()
  const { basePath } = config

  const logger = createLogger()
  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.green('[running]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}`)
  logger.info('')

  logger.info(
    `  ${pc.green('➜')}  ${pc.bold('Local')}:   ${pc.cyan(
      `http://localhost:${server.port}${basePath}`,
    )}`,
  )
}
