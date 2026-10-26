import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class OrderDetailPage extends BasePage {
  readonly heading: Locator
  readonly timelineCard: Locator
  readonly payNowButton: Locator
  readonly checkStatusButton: Locator
  readonly cancelOrderButton: Locator
  readonly invoiceButton: Locator
  readonly itemsCard: Locator
  readonly shippingCard: Locator
  readonly paymentSummaryCard: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.locator('h1')
    this.timelineCard = page.getByRole('heading', {
      name: /(status alur transaksi|alur pesanan & pengiriman)/i,
    })
    this.payNowButton = page.getByRole('button', { name: /bayar sekarang \(midtrans\)/i })
    this.checkStatusButton = page.getByRole('button', { name: /cek status pembayaran/i })
    this.cancelOrderButton = page.getByRole('button', { name: /batalkan pesanan/i })
    this.invoiceButton = page.getByRole('button', { name: /cetak invoice resmi/i })
    this.itemsCard = page.getByRole('heading', { name: 'Daftar Barang Belanja' })
    this.shippingCard = page.getByRole('heading', { name: 'Tujuan Pengiriman' })
    this.paymentSummaryCard = page.getByRole('heading', { name: 'Ringkasan Pembayaran' })
  }

  async goto(orderId: string): Promise<void> {
    await this.navigate(`/orders/${orderId}`)
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
    await expect(this.itemsCard).toBeVisible()
    await expect(this.shippingCard).toBeVisible()
    await expect(this.paymentSummaryCard).toBeVisible()
  }

  async assertRealtimeActive(): Promise<void> {
    await expect(this.timelineCard).toBeVisible({ timeout: 10000 })
  }

  async assertPayNowButtonVisible(): Promise<void> {
    await expect(this.payNowButton).toBeVisible({ timeout: 10000 })
  }

  async assertCheckStatusButtonVisible(): Promise<void> {
    await expect(this.checkStatusButton).toBeVisible({ timeout: 10000 })
  }
}
