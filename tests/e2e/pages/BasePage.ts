import type { Page } from '@playwright/test'
import { waitForHydration } from '../helpers'

export abstract class BasePage {
  constructor(public readonly page: Page) {}

  /**
   * Navigate to a relative path and wait for Vue hydration
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path)
    await this.waitForHydration()
  }

  /**
   * Wait for Vue 3 application hydration
   */
  async waitForHydration(timeout = 60000): Promise<void> {
    await waitForHydration(this.page, timeout)
  }

  /**
   * Take screenshot evidence for QA test reports
   */
  async takeScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true })
  }
}
