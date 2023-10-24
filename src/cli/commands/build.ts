import type { CAC } from 'cac'

export function cli_build(cli: CAC) {
  return cli
}
export async function build() {
  const { build } = await import('../../vite/build.js')
  await build()
}
