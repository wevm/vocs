/**
 * End-to-end coverage of saved pages in custom mode: the reader saves generated pages, and the
 * handler serves each page's permalink as server-rendered HTML that reads the same with
 * JavaScript off and loads no script or WebAssembly. Saving stores only what the handler renders.
 * @module
 */
import type { Browser, Page } from '@playwright/test'
import { compose, expect, test } from '../Playwright.js'

/** Saves the generated pages and returns the permalink path. */
async function save(page: Page) {
  await expect(page.locator('[data-vocs=page]')).toHaveAttribute('data-state', 'ready', {
    timeout: 30_000,
  })
  await page.getByRole('button', { name: 'Save' }).click()
  const link = page.getByRole('link', { name: 'Open permalink' })
  await expect(link).toHaveAttribute('href', /^\/docs\/pages\/[a-z0-9-]+-[a-z0-9]{6}$/)
  return (await link.getAttribute('href'))!
}

/** Opens a path with JavaScript off, and records every request the page sends. */
async function open(browser: Browser, origin: string, path: string) {
  const context = await browser.newContext({ baseURL: origin, javaScriptEnabled: false })
  const page = await context.newPage()
  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  const response = await page.goto(path)
  return { context, page, requests, response }
}

test('saves a page, and serves its permalink without JavaScript', async ({ browser, page }) => {
  await compose(page, 'Page', 'How do I use transferWithMemo?')
  const path = await save(page)
  await expect(page.locator('[data-vocs=page]')).toHaveAttribute('data-state', 'saved')

  const permalink = await open(browser, new URL(page.url()).origin, path)
  const article = permalink.page.locator('[data-vocs=page]')
  expect(permalink.response?.headers()['content-type']).toBe('text/html; charset=utf-8')
  await expect(permalink.page).toHaveTitle('Use transferWithMemo · Tempo')
  await expect(article.getByRole('heading', { level: 1 })).toHaveText('Use transferWithMemo')
  await expect(article.locator('[data-vocs=code]')).toHaveAttribute('data-state', 'highlighted')
  await expect(article.locator('[data-vocs=callout]')).toContainText('Rejected block')
  await expect(permalink.page.locator('[data-vocs=sidebar]')).toHaveCount(0)
  await expect(permalink.page.locator('script')).toHaveCount(0)
  expect(permalink.requests).toEqual([path])
  await permalink.context.close()
})

test('saves docs, and links their pages without JavaScript', async ({ browser, page }) => {
  await compose(page, 'Docs', 'Explain memos and fees')
  const path = await save(page)

  const permalink = await open(browser, new URL(page.url()).origin, path)
  const sidebar = permalink.page.getByRole('navigation', { name: 'Pages' })
  await expect(sidebar.getByRole('link')).toHaveText([
    'Overview',
    'Attach a Memo',
    'Pay Fees in Stablecoins',
  ])
  await expect(sidebar.getByRole('link', { name: 'Overview' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await sidebar.getByRole('link', { name: 'Attach a Memo' }).click()
  await expect(permalink.page).toHaveURL(`${path}/attach-a-memo`)
  const code = permalink.page.locator('[data-vocs=code]', { hasText: 'client.ts' })
  await expect(code.locator('.twoslash-query-line')).toContainText(
    'const transport: HttpTransport<undefined, false>',
  )

  await sidebar.getByRole('link', { name: 'Pay Fees in Stablecoins' }).click()
  await expect(permalink.page.getByRole('heading', { level: 1 })).toHaveText(
    'Pay Fees in Stablecoins',
  )
  await expect(permalink.page.locator('[data-vocs=mermaid] [data-vocs-part=source]')).toContainText(
    'Sender --> Fee[Fee token] --> Validator',
  )
  expect(permalink.requests.filter((request) => !request.startsWith(path))).toEqual([])
  await permalink.context.close()
})

test('stores only the HTML the handler renders, and rejects an invalid draft', async ({
  request,
}) => {
  const saved = await request.post('/docs/pages', {
    data: {
      files: [],
      pages: [
        {
          blocks: [
            {
              code: 'const memo = 1',
              html: '<img src=x onerror=alert(1)>',
              lang: 'ts',
              type: 'code',
            },
          ],
          group: 'Memos',
          slug: 'attach-a-memo',
          title: 'Attach a Memo',
        },
      ],
    },
  })
  expect(saved.status()).toBe(201)
  const html = await (await request.get((await saved.json()).url)).text()
  expect(html).not.toContain('onerror')
  expect(html).toContain('<span class="line"><span style="color:var(--vocs-code-token-keyword')

  const invalid = await request.post('/docs/pages', {
    data: {
      files: [],
      pages: [{ blocks: [], group: 'Memos', slug: 'Not A Slug', title: 'Memos' }],
    },
  })
  expect(invalid.status()).toBe(400)
  expect(await invalid.text()).toMatch(/^The pages are invalid:\n.*pages\[0\]\.slug/s)

  const missing = await request.get('/docs/pages/attach-a-memo-zzzzzz')
  expect(missing.status()).toBe(404)
})
