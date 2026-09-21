import { test } from '@playwright/test'
import { waitForHydration } from './helpers'

test('shots light dark', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await waitForHydration(page)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'test-results/shot4-light.png' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/shot4-dark.png' })
})
