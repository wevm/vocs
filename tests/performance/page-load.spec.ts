import { gzipSync } from 'node:zlib'
import { expect, type Page, test } from '@playwright/test'

test('production HTML preloads one font that CSS reuses', async ({ page }) => {
  const fonts: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.push(request.url())
  })
  const response = await page.goto('/', { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  // Inspect the response too: a preload inserted only after hydration is too late.
  expect(await response?.text()).toContain('as="font"')
  const preload = page.locator('head link[rel="preload"][as="font"]')
  await expect(preload).toHaveCount(1)
  await expect(preload).toHaveAttribute('crossorigin', /^(anonymous)?$/)
  await expect(page).toHaveTitle('Overview fixture')
  await expect(
    page.locator('pre span[style*="color"]', { hasText: 'SERVER_ONLY_TOKEN' }),
  ).toBeVisible()
  await expect(page.locator('pre span[style*="color"]', { hasText: 'puts' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const fontUrl = await preload.evaluate((element: HTMLLinkElement) => element.href)
  const fontResources = await page.evaluate(
    (url) => performance.getEntriesByName(url).length,
    fontUrl,
  )
  expect(fontResources, 'CSS must reuse the preloaded font, not download another copy').toBe(1)
  expect(fonts).toEqual([fontUrl])
})

test('initial JavaScript excludes build-only grammars and stays within budget', async ({
  page,
}, info) => {
  const scripts: Promise<{ url: string; source: string; gzipBytes: number }>[] = []
  page.on('response', (response) => {
    if (response.request().resourceType() !== 'script') return
    scripts.push(
      response.body().then((body) => ({
        url: response.url(),
        source: body.toString(),
        gzipBytes: gzipSync(body).length,
      })),
    )
  })
  await page.goto('/', { waitUntil: 'networkidle' })

  const loaded = await Promise.all(scripts)
  const gzipBytes = loaded.reduce((total, script) => total + script.gzipBytes, 0)
  await info.attach('initial-javascript.json', {
    body: JSON.stringify(
      { gzipBytes, scripts: loaded.map(({ source: _, ...rest }) => rest) },
      null,
      2,
    ),
    contentType: 'application/json',
  })
  // Deliberately generous: catches accidentally shipping the Ruby grammar or
  // highlighter at startup, not ordinary chunk reshuffling or small growth.
  expect(gzipBytes).toBeLessThan(350 * 1024)
  expect(loaded.map(({ source }) => source).join('\n')).not.toContain(
    'source.vocs-performance-server-only',
  )
})

test('shell geometry is stable while a cold font request is held', async ({ page }) => {
  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let requested = false
  await page.route('**/*.woff2', async (route) => {
    requested = true
    await gate
    await route.continue()
  })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
    await expect.poll(() => requested).toBe(true)
    expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(false)
    const before = await shell(page)
    release()
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(true)
    const after = await shell(page)
    for (const key of ['x', 'width'] as const)
      expect(
        Math.abs(after[key] - before[key]),
        `content ${key} changed after font load`,
      ).toBeLessThanOrEqual(1)
  } finally {
    release()
  }
})

test('repeat loads, navigation, search, and interactive highlighting still work', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const before = await shell(page)
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  expect(await shell(page)).toEqual(before)
  await page.getByRole('link', { name: 'Read the second page' }).click()
  await expect(page.getByRole('heading', { name: 'Second page', exact: true })).toBeVisible()
  await expect(page).toHaveTitle('Second fixture')
  const trigger = page.locator('[data-v-twoslash-trigger]', { hasText: 'message' }).first()
  await trigger.click()
  await expect(page.locator('[data-open] pre.shiki span[style*="color"]').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await page
    .getByRole('button', { name: /Search/ })
    .filter({ visible: true })
    .first()
    .click()
  await page.getByPlaceholder('Search...').fill('Overview')
  await expect(page.getByRole('dialog')).toContainText('Overview')
  await page.keyboard.press('Escape')
  expect(errors).toEqual([])
})

async function shell(page: Page) {
  return page
    .locator('main [data-v-content]')
    .first()
    .evaluate((element) => {
      const { x, width } = element.getBoundingClientRect()
      return { x, width }
    })
}
