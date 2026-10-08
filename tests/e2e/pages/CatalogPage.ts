import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class CatalogPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly productLinks: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Katalog' })
    this.searchInput = page.getByPlaceholder('Cari produk...')
    this.productLinks = page.locator('a[href^="/product/"]')
    this.emptyState = page.locator('text="Tidak ada produk"')
  }

  async goto(): Promise<void> {
    await this.navigate('/katalog')
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query)
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('')
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await expect(this.searchInput).toBeVisible()
  }

  async getProductCount(): Promise<number> {
    return await this.productLinks.count()
  }

  async clickFirstProduct(): Promise<void> {
    const first = this.productLinks.first()
    await expect(first).toBeVisible()
    await first.click()
  }

  async assertEmptyStateVisible(): Promise<void> {
    await expect(this.emptyState.first()).toBeVisible({ timeout: 15000 })
  }
}
