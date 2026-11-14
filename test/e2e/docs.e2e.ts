/**
 * End-to-end coverage of `<Docs />` in custom mode: the composer asks in chat, page, or docs mode,
 * the agent writes pages through the page tools, a sidebar lists several pages, code renders through
 * the render route with Twoslash, a revision changes the pages in place, and a chat answer becomes
 * a page.
 * @module
 */
import { compose, expect, test } from '../Playwright.js'

test('writes one page, and the page tools reject an invalid block and a type error', async ({
  page,
}) => {
  await compose(page, 'Page', 'How do I use transferWithMemo?')

  const article = page.locator('[data-vocs=page]')
  await expect(article).toHaveAttribute('data-state', 'ready', { timeout: 30_000 })
  await expect(page.locator('[data-vocs=sidebar]')).toHaveCount(0)
  await expect(article.getByRole('heading', { level: 1 })).toHaveText('Use transferWithMemo')
  await expect(article.locator('[data-vocs=prose]')).toHaveText(
    'Read in /sources/playground/docs/memos.md.',
  )
  const code = article.locator('[data-vocs=code]')
  await expect(code.locator('[data-vocs-part=title]')).toHaveText('transfer.ts')
  await expect(code).toHaveAttribute('data-state', 'highlighted')
  await expect(article.locator('[data-vocs=callout]')).toHaveText(
    'Rejected blockThe page tools rejected an invalid callout kind and a type error.',
  )
})

test('writes docs with a sidebar, and renders a diagram', async ({ page }) => {
  await compose(page, 'Docs', 'Explain memos and fees')

  const sidebar = page.getByRole('navigation', { name: 'Pages' })
  await expect(page.locator('[data-vocs=page]')).toHaveAttribute('data-state', 'ready', {
    timeout: 30_000,
  })
  await expect(sidebar.locator('[data-vocs-part=group-title]')).toHaveText(['Memos', 'Fees'])
  await expect(sidebar.locator('[data-vocs-part=link]')).toHaveText([
    'Overview',
    'Attach a Memo',
    'Pay Fees in Stablecoins',
  ])
  await expect(sidebar.getByRole('link', { name: 'Overview' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await sidebar.getByRole('link', { name: 'Pay Fees in Stablecoins' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pay Fees in Stablecoins')
  await expect(page.locator('[data-vocs=mermaid]')).toHaveAttribute('data-state', 'rendered')
  await expect(page.locator('[data-vocs=mermaid] svg')).toContainText('Fee token')
})

test('type-checks code with Twoslash, and shows types', async ({ page }) => {
  await compose(page, 'Docs', 'Explain memos and fees')
  await expect(page.locator('[data-vocs=page]')).toHaveAttribute('data-state', 'ready', {
    timeout: 30_000,
  })
  await page
    .getByRole('navigation', { name: 'Pages' })
    .getByRole('link', { name: 'Attach a Memo' })
    .click()

  const code = page.locator('[data-vocs=code]', { hasText: 'client.ts' })
  await expect(code).toHaveAttribute('data-state', 'highlighted')
  await expect(code.locator('[data-vocs-part=pre]')).not.toContainText('^?')
  await expect(code.locator('.twoslash-query-line')).toContainText(
    'const transport: HttpTransport<undefined, false>',
  )
  await expect(page.locator('[data-vocs=code-group]').getByRole('tabpanel')).toHaveAttribute(
    'data-state',
    'highlighted',
  )

  const popup = code
    .locator('[data-vocs-part=popup]', {
      has: page.locator('[data-vocs-part=types]', { hasText: /^function createClient/ }),
    })
    .first()
  const token = popup.locator('..')
  await expect(popup).toBeHidden()
  await token.hover()
  await expect(popup).toBeVisible()
})

test('revises the pages in place', async ({ page }) => {
  await compose(page, 'Page', 'How do I use transferWithMemo?')
  const article = page.locator('[data-vocs=page]')
  await expect(article).toHaveAttribute('data-state', 'ready', { timeout: 30_000 })
  await expect(article.locator('[data-vocs=blocks] > *')).toHaveCount(3)

  await page.getByRole('textbox', { name: 'Revise these pages' }).fill('shorter')
  await page.getByRole('button', { name: 'Revise' }).click()

  await expect(article).toHaveAttribute('data-state', 'ready', { timeout: 30_000 })
  const blocks = article.locator('[data-vocs=blocks] > *')
  await expect(blocks).toHaveCount(3)
  await expect(blocks.first()).toHaveText('Revised: shorter')
  await expect(article.locator('[data-vocs=callout]', { hasText: 'Rejected block' })).toHaveCount(0)
})

test('answers in chat from the composer', async ({ page }) => {
  await compose(page, 'Chat', 'How do I use transferWithMemo?')

  const message = page.locator('[data-vocs=message]')
  await expect(message).toHaveAttribute('data-state', 'done', { timeout: 30_000 })
  await expect(message.locator('[data-vocs-part=answer]')).toHaveText(
    'Found in 1 file: /sources/playground/docs/memos.md',
  )
})

test('turns a chat answer into a page that builds on it, and returns to the chat', async ({
  page,
}) => {
  await compose(page, 'Chat', 'How do I use transferWithMemo?')
  const message = page.locator('[data-vocs=message]')
  await expect(message).toHaveAttribute('data-state', 'done', { timeout: 30_000 })

  await message.getByRole('button', { name: 'Make a page' }).click()

  const article = page.locator('[data-vocs=page]')
  await expect(article).toHaveAttribute('data-state', 'ready', { timeout: 30_000 })
  await expect(article.getByRole('heading', { level: 1 })).toHaveText('Use transferWithMemo')
  await expect(article.locator('[data-vocs=callout]').first()).toHaveText(
    'From the chatFound in 1 file: /sources/playground/docs/memos.md',
  )

  await page.getByRole('button', { name: 'Back to chat' }).click()
  await expect(message.locator('[data-vocs-part=answer]')).toHaveText(
    'Found in 1 file: /sources/playground/docs/memos.md',
  )
})
