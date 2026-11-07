import { test, expect } from '@playwright/test'
import { waitForHydration } from './helpers'

test.describe('Etalase Kategori Publik (/c/[slug]) [TC-CAT-01]', () => {
  test('[Happy Path] Memuat rute kategori kanonik /c/tech dengan breadcrumb dan header', async ({
    page,
  }) => {
    await page.goto('/c/tech')
    await waitForHydration(page)

    // 1. Verifikasi Judul SEO Halaman
    await expect(page).toHaveTitle(/Tech & Gadget/)

    // 2. Verifikasi Breadcrumb Navigasi
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbNav).toBeVisible()
    await expect(breadcrumbNav.getByRole('link', { name: 'Beranda' })).toHaveAttribute('href', '/')
    await expect(breadcrumbNav.getByRole('link', { name: 'Katalog' })).toHaveAttribute(
      'href',
      '/katalog',
    )
    await expect(breadcrumbNav).toContainText('Tech & Gadget')

    // 3. Verifikasi Kartu Header Kategori Terkurasi
    await expect(page.getByRole('heading', { level: 1, name: 'Tech & Gadget' })).toBeVisible()
    await expect(page.getByText('Kategori Resmi')).toBeVisible()

    // 4. Verifikasi Tombol Menuju Katalog dengan Filter
    const filterBtn = page.getByRole('link', { name: 'Filter Lengkap di Katalog' })
    await expect(filterBtn).toBeVisible()
    await expect(filterBtn).toHaveAttribute('href', '/katalog?category=tech')
  })

  test('[Guard] Slug kategori tidak valid menampilkan empty state ramah', async ({ page }) => {
    await page.goto('/c/kategori-acak-tidak-ada-999')
    await waitForHydration(page)

    // 1. Verifikasi Empty State
    await expect(page.getByRole('heading', { name: 'Kategori Tidak Ditemukan' })).toBeVisible()
    await expect(
      page.getByText("Kategori 'kategori-acak-tidak-ada-999' tidak terdaftar"),
    ).toBeVisible()

    // 2. Verifikasi Aksi Pemulihan Navigasi
    const catalogCta = page.getByRole('button', { name: 'Jelajahi Semua Produk di Katalog' })
    await expect(catalogCta).toBeVisible()
    await expect
      .poll(
        async () => {
          await catalogCta.click()
          return page.url()
        },
        { timeout: 15000 },
      )
      .toMatch(/\/katalog/)
  })

  test('[Visual / Responsive] Layout kategori tertata rapi pada viewport mobile (375px)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/c/stationery')
    await waitForHydration(page)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Alat Tulis & Kerajinan' }),
    ).toBeVisible()
    await expect(page.getByText('Kategori Resmi')).toBeVisible()
  })
})
