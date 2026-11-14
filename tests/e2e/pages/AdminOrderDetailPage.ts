import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminOrderDetailPage extends BasePage {
  readonly heading: Locator
  readonly backToOrdersLink: Locator
  readonly transitionButtons: Locator
  readonly statusBadge: Locator
  readonly itemsCardHeading: Locator
  readonly shippingCardHeading: Locator
  readonly finalStatusNotice: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { level: 1 })
    this.backToOrdersLink = page.getByRole('link', { name: 'Kelola Pesanan' })
    this.transitionButtons = page.locator(
      'div.flex-wrap button:not([aria-label]), div.flex-wrap button',
    )
    this.statusBadge = page.locator('span.rounded-full, [role="status"]')
    this.itemsCardHeading = page.getByRole('heading', { name: 'Daftar Produk' })
    this.shippingCardHeading = page.getByRole('heading', { name: 'Informasi Pengiriman' })
    this.finalStatusNotice = page.getByText(/status final \(tidak dapat diubah\)/i)
  }

  async goto(orderId: string): Promise<void> {
    await this.navigate(`/admin/orders/${orderId}`)
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
    await expect(this.itemsCardHeading).toBeVisible()
    await expect(this.shippingCardHeading).toBeVisible()
  }

  async getTransitionButtonLabels(): Promise<string[]> {
    const count = await this.transitionButtons.count()
    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await this.transitionButtons.nth(i).innerText()
      labels.push(text.trim())
    }
    return labels
  }

  async assertStateTransitionsExistOrFinal(): Promise<void> {
    const hasTransitions = (await this.transitionButtons.count()) > 0
    const isFinal = await this.finalStatusNotice.isVisible()
    expect(hasTransitions || isFinal).toBe(true)
  }
}
