/**
 * Measures Spike A in headless Chromium. Each sample opens a fresh browser context, so no
 * module is cached, asks one question, and reads `window.metrics` and the JS heap size.
 * Pass the page URL as the first argument and the sample count as the second.
 * @module
 */
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:5180/'
const count = Number(process.argv[3] ?? 5)
const browser = await chromium.launch()
const samples: Record<string, number>[] = []

for (let index = 0; index < count; index++) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const session = await context.newCDPSession(page)
  await page.goto(url)
  await page.locator('[data-vocs=root][data-state=ready]').waitFor()
  await page.getByLabel('What do you want to learn?').fill('How do I use transferWithMemo?')
  await page.getByRole('button', { name: 'Ask' }).click()
  await page.locator('[data-vocs=root][data-state=done]').waitFor({ timeout: 120_000 })
  const metrics = (await page.evaluate('window.metrics')) as Record<string, number>
  await session.send('HeapProfiler.collectGarbage')
  const heap = (await session.send('Runtime.getHeapUsage')) as { usedSize: number }
  samples.push({ ...metrics, 'heap.mb': Math.round(heap.usedSize / 1e6) })
  await context.close()
}

await browser.close()

const names = Object.keys(samples[0] ?? {})
const rows = names.map((name) => {
  const values = samples.map((sample) => sample[name] ?? 0).sort((a, b) => a - b)
  return `${name.padEnd(22)} median ${values[Math.floor(values.length / 2)]}  min ${values[0]}  max ${values.at(-1)}`
})
process.stdout.write(`${count} samples at ${url}\n${rows.join('\n')}\n`)
