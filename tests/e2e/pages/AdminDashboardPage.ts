import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminDashboardPage extends BasePage {
  readonly heading: Locator
  readonly revenueCard: Locator
  readonly pendingOrdersCard: Locator
  readonly lowStockCard: Locator
  readonly totalCustomersCard: Locator
  readonly manageOrdersButton: Locator
  readonly refreshButton: Locator
  readonly recentTransactionsHeading: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Dashboard Eksekutif' })
    this.revenueCard = page.getByText('Revenue Bulan Ini')
    this.pendingOrdersCard = page.getByText('Pesanan Pending')
    this.lowStockCard = page.getByText('Stok Kritis (< 5)')
    this.totalCustomersCard = page.getByText('Total Pelanggan')
    this.manageOrdersButton = page.getByRole('link', { name: 'Kelola Pesanan' })
    this.refreshButton = page.getByRole('button', { name: 'Perbarui Data' })
    this.recentTransactionsHeading = page.getByRole('heading', { name: 'Transaksi Terbaru' })
  }

  async goto(): Promise<void> {
    await this.navigate('/admin')
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
  }

  async assertKpiCardsVisible(): Promise<void> {
    await expect(this.revenueCard).toBeVisible({ timeout: 10000 })
    await expect(this.pendingOrdersCard).toBeVisible()
    await expect(this.lowStockCard).toBeVisible()
    await expect(this.totalCustomersCard).toBeVisible()
  }

  async goToOrders(): Promise<void> {
    await expect(this.manageOrdersButton).toBeVisible()
    await this.manageOrdersButton.click()
  }
}
