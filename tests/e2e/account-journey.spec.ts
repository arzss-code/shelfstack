import { test, expect } from '@playwright/test'
import { LoginPage, AccountPage } from './pages'
import { waitForHydration } from './helpers'

test.describe('ShelfStack Account & Address Book Journey [SHF-E2E-ACC]', () => {
  test('[SHF-E2E-ACC-01] Tamu diblokir dari area akun dan API ditolak dengan HTTP 401', async ({
    page,
    request,
  }) => {
    // 1. Guard check pada halaman /account/profile
    await page.goto('/account/profile')
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()

    // 2. Guard check pada halaman /account/addresses
    await page.goto('/account/addresses')
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)

    // 3. Anon API check: PATCH /api/account/profile wajib 401
    const patchRes = await request.patch('/api/account/profile', {
      data: { full_name: 'Penyerang Anonim' },
    })
    expect([401, 403]).toContain(patchRes.status())

    // 4. Anon API check: GET /api/account/stats wajib 401
    const statsRes = await request.get('/api/account/stats')
    expect([401, 403]).toContain(statsRes.status())

    // 5. Anon API check: GET & POST /api/addresses wajib 401
    const addrGetRes = await request.get('/api/addresses')
    expect([401, 403]).toContain(addrGetRes.status())

    const addrPostRes = await request.post('/api/addresses', {
      data: {
        name: 'Test',
        phone: '08123456789',
        street: 'Jl Test',
        city: 'Bandung',
        postal: '40132',
      },
    })
    expect([401, 403]).toContain(addrPostRes.status())
  })

  test('[SHF-E2E-ACC-02] Pengguna terautentikasi dapat melihat profil, tabs, dan buku alamat', async ({
    page,
  }) => {
    const customerEmail = process.env.E2E_CUSTOMER_EMAIL
    const customerPassword = process.env.E2E_CUSTOMER_PASSWORD

    test.skip(
      !customerEmail || !customerPassword,
      'Kredensial pelanggan E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD tidak tersedia di environment ini',
    )

    const loginPage = new LoginPage(page)
    const accountPage = new AccountPage(page)

    // 1. Login sebagai customer
    await loginPage.navigate('/auth/login')
    await loginPage.login(customerEmail!, customerPassword!)
    await expect(page).toHaveURL('/')

    // 2. Akses halaman profil via URL langsung
    await accountPage.gotoProfile()
    await accountPage.assertProfileLoaded()

    // 3. Navigasi ke Buku Alamat via Tab
    await accountPage.addressesTab.click()
    await expect(page).toHaveURL(/\/account\/addresses/)
    await expect(accountPage.addAddressButton).toBeVisible({ timeout: 15000 })

    // 4. Buka Modal Tambah Alamat Baru
    await accountPage.openAddAddressModal()
    await expect(accountPage.recipientNameInput).toBeVisible()

    // 5. Tutup modal menggunakan tombol Batal
    await page.getByRole('button', { name: /batal/i }).click()
    await expect(accountPage.recipientNameInput).not.toBeVisible()
  })
})
