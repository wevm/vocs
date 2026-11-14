/**
 * Measures Spike B in local workerd. For each sample, it starts a fresh `wrangler dev`, so the
 * first request runs in a new isolate, then sends warm requests. It reports request latency,
 * which approximates CPU time for these CPU-bound renders, and the workerd resident memory
 * before the first render and after the last.
 * @module
 */
import * as ChildProcess from 'node:child_process'

const port = 8790
const warm = 10
const samples = ['shiki', 'twoslash-lib', 'twoslash-viem'] as const

for (const sample of samples) {
  const server = ChildProcess.spawn(
    'pnpm',
    ['exec', 'wrangler', 'dev', '--port', String(port), '--log-level', 'error'],
    { cwd: new URL('..', import.meta.url).pathname, detached: true, stdio: 'ignore' },
  )
  await ready()
  const before = rss()

  const cold = await time(sample)
  const warmTimes: number[] = []
  for (let index = 0; index < warm; index++) warmTimes.push(await time(sample))
  warmTimes.sort((a, b) => a - b)
  const memory = rss()

  process.stdout.write(
    `${sample.padEnd(14)} cold ${cold.toFixed(0)} ms  warm median ${warmTimes[Math.floor(warm / 2)]!.toFixed(0)} ms  max ${warmTimes.at(-1)!.toFixed(0)} ms  workerd rss ${before} -> ${memory} MB\n`,
  )

  process.kill(-server.pid!, 'SIGTERM')
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function ready() {
  for (let attempt = 0; attempt < 240; attempt++) {
    const status = await fetch(`http://localhost:${port}/`).then(
      (response) => response.status,
      () => 0,
    )
    if (status === 404) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('wrangler dev did not start within 60 seconds.')
}

async function time(sample: string) {
  const start = performance.now()
  const response = await fetch(`http://localhost:${port}/render/${sample}`)
  const html = await response.text()
  if (!response.ok || !html.includes('<pre'))
    throw new Error(`Render "${sample}" failed with ${response.status}: ${html.slice(0, 300)}`)
  return performance.now() - start
}

function rss() {
  const output = ChildProcess.execSync('ps -C workerd -o rss=').toString()
  const kilobytes = output
    .split('\n')
    .map(Number)
    .filter((value) => value > 0)
  return Math.round(Math.max(0, ...kilobytes) / 1024)
}
