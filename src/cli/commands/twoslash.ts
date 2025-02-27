import pc from 'picocolors'
import { createLogger } from 'vite'
import { buildTwoslash } from '../../vite/buildTwoslash.js'
import { version } from '../version.js'

export async function twoslash() {
  const start = Date.now()

  const logger = createLogger('info', { allowClearScreen: true })

  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.blue('[building twoslash]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}\n`)

  await buildTwoslash()

  const end = Date.now()
  const time = end - start
  logger.info(`\n  ${pc.green('[built twoslash]')} in ${time / 1000}s`)
}
