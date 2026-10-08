import { test, expect } from '@playwright/test'
import { CatalogPage, LoginPage, AdminOrdersPage } from './pages'

test.describe('Automated E2E Flow via Page Object Model [SHF-POM-01]', () => {
  test('[SHF-CAT-01] Catalog Page: Browse, Search, and Verify Empty State via POM', async ({
    page,
  }) => {
    const catalogPage = new CatalogPage(page)

    // 1. Buka katalog publik
    await catalogPage.goto()
    await catalogPage.assertPageLoaded()

    // 2. Lakukan pencarian kata kunci yang tidak mungkin ada dengan polling hidrasi
    await expect
      .poll(
        async () => {
          await catalogPage.search('produk-tidak-mungkin-ada-xyz-999')
          return await page.getByText('Tidak ada produk').count()
        },
        { timeout: 20000 },
      )
      .toBeGreaterThan(0)

    // 3. Bersihkan pencarian
    await catalogPage.clearSearch()
  })

  test('[SHF-AUT-01] Auth Page: Form Validation & Security Protection via POM', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)

    // 1. Buka halaman login
    await loginPage.goto()
    await loginPage.assertPageLoaded()

    // 2. Submit form dengan email tidak valid
    await loginPage.fillEmail('bukan-email-valid')

    // 3. Verifikasi pesan error Zod client-side
    await expect
      .poll(
        async () => {
          await loginPage.submit()
          return await page.getByText('Email tidak valid.').count()
        },
        { timeout: 20000 },
      )
      .toBeGreaterThan(0)
  })

  test('[SHF-ADM-01] Admin Orders: Guard Unauthenticated User Redirects to Login via POM', async ({
    page,
  }) => {
    const adminOrdersPage = new AdminOrdersPage(page)

    // 1. Tamu mencoba mengakses /admin/orders langsung
    await page.goto('/admin/orders')

    // 2. Verifikasi diarahkan ke login dengan parameter redirect
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)

    // 3. Verifikasi halaman login tampil melalui POM
    const loginPage = new LoginPage(page)
    await loginPage.assertPageLoaded()
  })
})
