import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class CartDrawer extends BasePage {
  readonly drawer: Locator
  readonly heading: Locator
  readonly totalItemsBadge: Locator
  readonly items: Locator
  readonly closeButton: Locator
  readonly checkoutButton: Locator
  readonly fullCartLink: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)
    this.drawer = page.locator('aside[aria-label="Keranjang Belanja"]')
    this.heading = page.getByRole('heading', { name: /keranjang belanja/i })
    this.totalItemsBadge = page.locator('aside[aria-label="Keranjang Belanja"] h2 span')
    this.items = page.locator('aside[aria-label="Keranjang Belanja"] article')
    this.closeButton = page.locator('button[aria-label="Tutup Keranjang"]')
    this.checkoutButton = page
      .locator('aside[aria-label="Keranjang Belanja"]')
      .getByRole('button', {
        name: /checkout sekarang/i,
      })
    this.fullCartLink = page.locator('aside[aria-label="Keranjang Belanja"]').getByRole('button', {
      name: /buka halaman keranjang lengkap/i,
    })
    this.emptyState = page.getByText(/keranjang anda masih kosong/i)
  }

  async assertOpen(): Promise<void> {
    await expect(this.drawer).toBeVisible({ timeout: 10000 })
    await expect(this.heading).toBeVisible()
  }

  async assertClosed(): Promise<void> {
    await expect(this.drawer).not.toBeVisible()
  }

  async getItemCount(): Promise<number> {
    return await this.items.count()
  }

  async getTotalItemsBadgeText(): Promise<string> {
    return (await this.totalItemsBadge.innerText()).trim()
  }

  async close(): Promise<void> {
    await this.closeButton.click()
  }

  async goToCheckout(): Promise<void> {
    await this.checkoutButton.click()
  }

  async goToCartPage(): Promise<void> {
    await this.fullCartLink.click()
  }
}
