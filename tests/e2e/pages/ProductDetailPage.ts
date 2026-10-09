import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductDetailPage extends BasePage {
  readonly title: Locator
  readonly addToCartButton: Locator
  readonly buyNowButton: Locator
  readonly cartDrawerHeading: Locator
  readonly checkoutButton: Locator
  readonly specsHeading: Locator
  readonly galleryThumbnails: Locator
  readonly quantityInput: Locator
  readonly incrementQtyButton: Locator
  readonly decrementQtyButton: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.locator('h1, h2.font-display').first()
    this.addToCartButton = page.getByRole('button', {
      name: /tambah ke bag/i,
    })
    this.buyNowButton = page.getByRole('button', {
      name: /pesan cepat 1-klik|beli sekarang/i,
    })
    this.cartDrawerHeading = page.getByText(/keranjang belanja|isi keranjang/i)
    this.checkoutButton = page.getByRole('link', { name: /lanjut ke pembayaran|checkout/i })
    this.specsHeading = page.getByRole('heading', { name: /spesifikasi teknis/i })
    this.galleryThumbnails = page.locator('button[aria-label*="sudut gambar"]')
    this.quantityInput = page.locator('input[aria-label="Jumlah unit pesanan"]')
    this.incrementQtyButton = page.locator('button[aria-label="Tambah jumlah"]')
    this.decrementQtyButton = page.locator('button[aria-label="Kurangi jumlah"]')
  }

  async goto(slugOrId: string): Promise<void> {
    await this.navigate(`/product/${slugOrId}`)
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.title).toBeVisible({ timeout: 15000 })
    await expect(this.addToCartButton).toBeVisible()
  }

  async assertSpecsVisible(): Promise<void> {
    await expect(this.specsHeading).toBeVisible({ timeout: 10000 })
  }

  async getGalleryThumbnailsCount(): Promise<number> {
    return await this.galleryThumbnails.count()
  }

  async clickGalleryThumbnail(index: number): Promise<void> {
    const thumb = this.galleryThumbnails.nth(index)
    await expect(thumb).toBeVisible()
    await thumb.click()
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }

  async buyNow(): Promise<void> {
    await this.buyNowButton.click()
  }

  async assertCartDrawerOpen(): Promise<void> {
    await expect(this.cartDrawerHeading.first()).toBeVisible({ timeout: 10000 })
  }
}
