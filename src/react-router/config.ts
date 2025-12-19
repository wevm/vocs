import type { Config } from '@react-router/dev/config'
// @ts-expect-error
import c from '../.vocs/react-router.config.js'

export const config = c

export function withVocsConfig(config: Config): Config {
  return { ...c, ...config }
}
