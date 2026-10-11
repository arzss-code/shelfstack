import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class CatalogPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly productLinks: Locator
  readonly emptyState: Locator

  readonly productCards: Locator
  readonly categoryButtons: Locator
  readonly quickAddButtons: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Katalog' })
    this.searchInput = page.getByPlaceholder('Cari produk...')
    this.productLinks = page.locator('a[href^="/product/"]')
    this.emptyState = page.locator('text="Tidak ada produk"')
    this.productCards = page.locator('article.product-card')
    this.categoryButtons = page.locator('aside button')
    this.quickAddButtons = page.locator('button[aria-label*="ke Keranjang"]')
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

  async filterByCategory(categoryName: string): Promise<void> {
    const btn = this.page.locator('aside button').filter({ hasText: categoryName }).first()
    await expect(btn).toBeVisible({ timeout: 10000 })
    await btn.click()
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

  async clickProductByTitle(title: string | RegExp): Promise<void> {
    const link = this.page.getByRole('link', { name: title }).first()
    await expect(link).toBeVisible({ timeout: 10000 })
    await link.click()
  }

  async quickAddFirstProduct(): Promise<void> {
    const firstQuickAdd = this.quickAddButtons.first()
    await expect(firstQuickAdd).toBeVisible({ timeout: 10000 })
    await firstQuickAdd.click()
  }

  async assertEmptyStateVisible(): Promise<void> {
    await expect(this.emptyState.first()).toBeVisible({ timeout: 15000 })
  }
}
