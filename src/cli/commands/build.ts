import ora from 'ora'
import pc from 'picocolors'
import { createLogger } from 'vite'
import type { BuildParameters as BuildParameters_ } from '../../vite/build.js'
import { version } from '../version.js'

export type BuildParameters = Pick<BuildParameters_, 'logLevel' | 'outDir' | 'publicDir'>

export async function build({ logLevel, outDir, publicDir }: BuildParameters) {
  const { build } = await import('../../vite/build.js')

  const useLogger = logLevel !== 'info'

  const start = Date.now()

  const logger = createLogger('info', { allowClearScreen: true })

  const spinner = {
    client: ora('building bundles...\n'),
    prerender: ora('prerendering pages...\n'),
  }

  logger.clearScreen('info')
  logger.info('')
  logger.info(`  ${pc.blue('[building]')} ${pc.bold('vocs')}@${pc.dim(`v${version}`)}\n`)
  await build({
    hooks: {
      onBundleStart() {
        if (useLogger) spinner.client.start()
      },
      onBundleEnd({ error }) {
        if (error) {
          if (useLogger) spinner.client.fail('bundles failed to build')
          return
        }

        if (useLogger) spinner.client.succeed('bundles built')
        else logger.info('')
      },
      onPrerenderStart() {
        if (useLogger) spinner.prerender.start()
      },
      onPrerenderEnd({ error }) {
        if (error) {
          if (useLogger) spinner.client.fail('bundles failed to build')
          return
        }

        if (useLogger) spinner.prerender.succeed('prerendered pages')
      },
      onScriptsEnd() {
        if (!useLogger) logger.info('')
      },
    },
    logger,
    logLevel,
    outDir,
    publicDir,
  })

  const end = Date.now()
  const time = end - start
  logger.info(`\n  ${pc.green('[built]')} in ${time / 1000}s`)
}
