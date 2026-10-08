import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductDetailPage extends BasePage {
  readonly title: Locator
  readonly addToCartButton: Locator
  readonly cartDrawerHeading: Locator
  readonly checkoutButton: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.locator('h1')
    this.addToCartButton = page.getByRole('button', {
      name: /tambah ke keranjang|keranjang/i,
    })
    this.cartDrawerHeading = page.getByText(/keranjang belanja|isi keranjang/i)
    this.checkoutButton = page.getByRole('link', { name: /lanjut ke pembayaran|checkout/i })
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.title).toBeVisible()
    await expect(this.addToCartButton).toBeVisible()
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }

  async assertCartDrawerOpen(): Promise<void> {
    await expect(this.cartDrawerHeading.first()).toBeVisible({ timeout: 10000 })
  }
}
