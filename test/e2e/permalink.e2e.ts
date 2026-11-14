/**
 * End-to-end coverage of saved pages in custom mode: the reader saves generated pages, and the
 * handler serves each page's permalink as server-rendered HTML that reads the same with
 * JavaScript off. One inline module switches code tabs and copies code. A registered demo renders
 * on the server and hydrates as an island, so only a page with a demo loads React. Saving stores
 * only what the handler renders.
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

/** Switches the code tabs of "Attach a Memo", and copies its code. */
async function tabsAndCopy(page: Page) {
  const group = page.locator('[data-vocs=code-group]')
  await group.getByRole('tab', { name: 'pnpm' }).click()
  await expect(group.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('aria-selected', 'true')
  await expect(group.getByRole('tab', { name: 'npm', exact: true })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await expect(group.getByRole('tabpanel')).toHaveText('pnpm add viem')
  await expect(group.getByText('npm i viem')).toBeHidden()

  const copy = group.getByRole('button', { name: 'Copy code' })
  await copy.click()
  await expect(copy).toHaveText('Copied')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('pnpm add viem')
  await page.getByRole('heading', { level: 1 }).hover()
  await expect(copy).toHaveText('Copy')

  await page
    .locator('[data-vocs=code]', { hasText: 'client.ts' })
    .getByRole('button', { name: 'Copy code' })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(
      [
        "import { createClient, http } from 'viem'",
        '',
        "const transport = http('https://rpc.tempo.xyz')",
        'const client = createClient({ transport })',
      ].join('\n'),
    )
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
  await expect(permalink.page.locator('script')).toHaveCount(1)
  await expect(permalink.page.locator('script')).not.toHaveAttribute('src')
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
  // "Attach a Memo" has a demo. Chromium fetches its module preloads, but runs no script.
  const others = permalink.requests.filter((request) => !request.startsWith(path))
  expect(others.every((request) => request.startsWith('/assets/'))).toBe(true)
  expect(others.filter((request) => /vocs-islands-/.test(request))).toEqual([])
  await permalink.context.close()
})

test('switches code tabs and copies code, in the page and its permalink', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await compose(page, 'Docs', 'Explain memos and fees')
  const path = await save(page)
  await page
    .getByRole('navigation', { name: 'Pages' })
    .getByRole('link', { name: 'Attach a Memo' })
    .click()
  await tabsAndCopy(page)

  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  await page.goto(`${path}/attach-a-memo`)
  await tabsAndCopy(page)
  // The page's demo loads the islands module. Tabs and copy buttons add no request.
  expect(requests.filter((request) => !request.startsWith('/assets/'))).toEqual([
    `${path}/attach-a-memo`,
  ])
})

test('renders a registered demo on the server, and hydrates it on the permalink', async ({
  browser,
  page,
}) => {
  const memo = (container: Page | ReturnType<Page['locator']>) => ({
    input: container.getByRole('textbox', { name: 'Memo' }),
    output: container.locator('output'),
  })
  const hex = (text: string) => `0x${Buffer.from(text).toString('hex').padEnd(64, '0')}`

  await compose(page, 'Docs', 'Explain memos and fees')
  const path = `${await save(page)}/attach-a-memo`
  await page
    .getByRole('navigation', { name: 'Pages' })
    .getByRole('link', { name: 'Attach a Memo' })
    .click()
  const live = memo(page.locator('[data-vocs=demo]'))
  await live.input.fill('hello')
  await expect(live.output).toHaveText(hex('hello'))

  const off = await open(browser, new URL(page.url()).origin, path)
  const island = off.page.locator('[data-vocs=demo] [data-vocs-part=island]')
  await expect(island).toHaveAttribute('data-state', 'static')
  await expect(memo(island).input).toHaveValue('invoice 42')
  await expect(memo(island).output).toHaveText(hex('invoice 42'))
  await off.context.close()

  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  await page.goto(path)
  const hydrated = page.locator('[data-vocs-part=island]')
  await expect(hydrated).toHaveAttribute('data-state', 'hydrated')
  await memo(hydrated).input.fill('refund 7')
  await expect(memo(hydrated).output).toHaveText(hex('refund 7'))
  expect(requests[0]).toBe(path)
  expect(requests.slice(1).every((request) => request.startsWith('/assets/'))).toBe(true)
  expect(requests.filter((request) => /vocs-islands-.*\.js$/.test(request))).toHaveLength(1)
  expect(requests.filter((request) => /\.wasm$|\/Agent-/.test(request))).toEqual([])
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
