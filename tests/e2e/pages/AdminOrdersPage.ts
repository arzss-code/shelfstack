import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminOrdersPage extends BasePage {
  readonly heading: Locator
  readonly refreshButton: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator

  readonly exportMenuButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Kelola Pesanan' })
    this.refreshButton = page.getByRole('button', { name: 'Muat Ulang' })
    this.exportMenuButton = page.getByRole('button', { name: /ekspor data/i })
    this.searchInput = page.getByPlaceholder('Cari ID / Nama...')
    this.tableRows = page.locator('table tbody tr')
  }

  async goto(): Promise<void> {
    await this.navigate('/admin/orders')
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
    await expect(this.searchInput).toBeVisible()
  }

  async clickStatusTab(statusLabel: string): Promise<void> {
    const tabButton = this.page
      .getByRole('tab', { name: statusLabel, exact: true })
      .or(this.page.getByRole('button', { name: statusLabel, exact: true }))
    await tabButton.click()
  }

  async searchOrder(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.getByRole('button', { name: 'Cari' }).click()
  }

  async getOrderRowCount(): Promise<number> {
    return await this.tableRows.count()
  }

  async openFirstOrderDetail(): Promise<void> {
    const detailLink = this.tableRows.first().getByRole('link', { name: /detail/i })
    await expect(detailLink).toBeVisible({ timeout: 10000 })
    await detailLink.click()
  }
}
