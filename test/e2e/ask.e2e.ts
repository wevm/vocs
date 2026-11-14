/**
 * End-to-end coverage of custom mode: a host page renders `<Ask />`, the agent loads on the first
 * question, searches the corpus the handler serves, and streams an answer that cites the file.
 * @module
 */
import { expect, hydrated, test } from '../Playwright.js'

test('answers a question with the file that matches it', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  await expect(page.locator('[data-vocs=ask]')).toHaveAttribute('data-state', 'idle')

  await test.step('ask', async () => {
    await page.getByLabel('What do you want to learn?').fill('How do I use transferWithMemo?')
    await page.getByRole('button', { name: 'Ask' }).click()
  })

  const message = page.locator('[data-vocs=message]')

  await test.step('answer', async () => {
    await expect(message).toHaveAttribute('data-state', 'done', { timeout: 30_000 })
    await expect(page.locator('[data-vocs=ask]')).toHaveAttribute('data-state', 'ready')
    await expect(message.locator('[data-vocs-part=prompt]')).toHaveText(
      'How do I use transferWithMemo?',
    )
    await expect(message.locator('[data-vocs-part=answer]')).toHaveText(
      'Found in 1 file: /sources/playground/docs/memos.md',
    )
    await expect(message.locator('[data-vocs-part=files] li')).toHaveText([
      '/sources/playground/docs/memos.md',
    ])
  })
})

test('answers a second question in the same session', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)

  for (const prompt of ['How do I use transferWithMemo?', 'Who pays stablecoin fees?']) {
    await page.getByLabel('What do you want to learn?').fill(prompt)
    await page.getByRole('button', { name: 'Ask' }).click()
  }

  const messages = page.locator('[data-vocs=message]')
  await expect(messages).toHaveCount(2)
  await expect(messages.nth(1)).toHaveAttribute('data-state', 'done', { timeout: 30_000 })
  await expect(messages.nth(0)).toHaveAttribute('data-state', 'done')
  await expect(messages.nth(1).locator('[data-vocs-part=answer]')).toContainText(
    '/sources/playground/docs/fees.md',
  )
})
