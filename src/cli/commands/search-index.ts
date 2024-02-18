import pc from 'picocolors'
import { createLogger } from 'vite'
import type { BuildSearchIndexParameters } from '../../vite/buildSearchIndex.js'
import { buildSearchIndex } from '../../vite/buildSearchIndex.js'
import { version } from '../version.js'

export type SearchIndexParameters = BuildSearchIndexParameters

export async function searchIndex({ outDir }: SearchIndexParameters) {
  const start = Date.now()

  const logger = createLogger('info', { allowClearScreen: true })

  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.blue('[indexing]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}\n`)

  await buildSearchIndex({ outDir })

  const end = Date.now()
  const time = end - start
  logger.info(`\n  ${pc.green('[indexed]')} in ${time / 1000}s`)
}
