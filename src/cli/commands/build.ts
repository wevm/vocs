export async function build() {
  const { build } = await import('../../vite/build.js')
  await build()
}
