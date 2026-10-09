import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class CartPage extends BasePage {
  readonly heading: Locator
  readonly items: Locator
  readonly checkoutButton: Locator
  readonly continueShoppingButton: Locator
  readonly emptyState: Locator
  readonly totalTagihan: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.locator('h1').filter({ hasText: 'Keranjang Belanja' })
    this.items = page.locator('article')
    this.checkoutButton = page.getByRole('button', { name: /lanjut ke pembayaran/i })
    this.continueShoppingButton = page.getByRole('link', { name: /lanjut belanja/i })
    this.emptyState = page.getByText(/keranjang belanja anda masih kosong/i)
    this.totalTagihan = page.locator('aside').getByText(/total tagihan/i)
  }

  async goto(): Promise<void> {
    await this.navigate('/cart')
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
  }

  async getItemCount(): Promise<number> {
    return await this.items.count()
  }

  async proceedToCheckout(): Promise<void> {
    await expect(this.checkoutButton).toBeVisible()
    await this.checkoutButton.click()
  }

  async assertEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 })
  }
}
