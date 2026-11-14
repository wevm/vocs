/**
 * Playwright `test` and `expect` for end-to-end suites. Each test fails when its page logs a
 * console error or throws an uncaught exception.
 * @module
 */
import { expect, type Page, test as base } from '@playwright/test'

export { expect }

export const test = base.extend<{ page: Page }>({
  // Playwright reads fixture dependencies from a destructuring pattern, so this signature needs one.
  async page({ page }, use) {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await use(page)

    expect(errors, 'The page logged errors.').toEqual([])
  },
})

/** Waits until the prompt box has rendered and reports the agent's status. */
export async function hydrated(page: Page) {
  await expect(page.locator('[data-vocs=ask]')).toHaveAttribute('data-state', /.+/)
}

/** Opens `<Docs />`, picks a composer mode, and submits a prompt. */
export async function compose(page: Page, mode: 'Chat' | 'Docs' | 'Page', prompt: string) {
  await page.goto('/')
  await expect(page.locator('[data-vocs=composer]')).toBeVisible()
  await page.getByRole('radio', { name: mode }).click()
  await page.getByRole('textbox', { name: 'What do you want to learn?' }).fill(prompt)
  await page.keyboard.press('Enter')
}
