import { test, expect } from '@playwright/test'
import { waitForHydration } from './helpers'

test.describe('Katalog Publik [TC-PRD-01]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/katalog')
    await waitForHydration(page)
  })

  test('[Happy Path] Should load public catalog', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Katalog' })).toBeVisible()
    await expect(page.getByPlaceholder('Cari produk...')).toBeVisible()
    // Daftar atau empty state — keduanya valid tergantung isi DB
    await expect(
      page
        .locator('.product-card,:has-text("Tidak ada produk"),:has-text("Tidak ada hasil")')
        .first(),
    ).toBeVisible({ timeout: 15000 })
  })

  test('[Happy Path] Search tanpa hasil menampilkan empty state', async ({ page }) => {
    // Isi ulang di tiap poll: fill pre-hydration penuh kadang ter-wipe (lihat helpers.ts)
    await expect
      .poll(
        async () => {
          await page.getByPlaceholder('Cari produk...').fill('zzz-tidak-mungkin-ada-123')
          return await page.getByText('Tidak ada produk').count()
        },
        { timeout: 20000 },
      )
      .toBeGreaterThan(0)
  })

  test('[Guard] Halaman admin wajib login', async ({ page }) => {
    await page.goto('/admin/products')
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
  })

  test('[Visual] UI behaves responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: 'Katalog' })).toBeVisible()
    await expect(page.getByPlaceholder('Cari produk...')).toBeVisible()
  })
})
