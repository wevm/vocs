/**
 * End-to-end coverage of Spike A: the agent runs one turn in the page, searches the corpus,
 * and streams an answer that cites the matched file.
 * @module
 */
import { expect, hydrated, test } from '../Playwright.js'

test('answers a question with the file that matches it', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)

  await test.step('ask', async () => {
    await page.getByLabel('What do you want to learn?').fill('How do I use transferWithMemo?')
    await page.getByRole('button', { name: 'Ask' }).click()
  })

  await test.step('answer', async () => {
    await expect(page.locator('[data-vocs=root]')).toHaveAttribute('data-state', 'done', {
      timeout: 30_000,
    })
    await expect(page.locator('[data-vocs=answer]')).toHaveText('Found in 1 file: /docs/memos.md')
  })
})
