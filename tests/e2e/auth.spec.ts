import { test, expect } from '@playwright/test'
import { waitForHydration } from './helpers'

// Sprint 2: guard + validasi auth. Tidak butuh user asli —
// sisi server diuji via request anon (wajib 401/403), sisi UI via validasi form.

test('tamu dibuka /admin/activities dilempar ke login', async ({ page }) => {
  await page.goto('/admin/activities')

  await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
})

test('form register menolak input kosong (client-side Zod)', async ({ page }) => {
  await page.goto('/auth/register')
  await waitForHydration(page)

  // Klik sampai error muncul (dev cold-start kadang menelan klik pertama pre-hydration penuh)
  await expect
    .poll(
      async () => {
        await page.locator('form').getByRole('button', { name: 'Buat Akun' }).click()
        return await page.getByText('Nama minimal 3 karakter.').count()
      },
      { timeout: 20000 },
    )
    .toBeGreaterThan(0)
  await expect(page.getByText('Email tidak valid.')).toBeVisible({ timeout: 15000 })
})

test('form login menolak email invalid', async ({ page }) => {
  await page.goto('/auth/login')
  await waitForHydration(page)

  await page.getByPlaceholder('nama@email.com').fill('bukan-email')
  await expect
    .poll(
      async () => {
        await page.locator('form').getByRole('button', { name: 'Masuk' }).click()
        return await page.getByText('Email tidak valid.').count()
      },
      { timeout: 20000 },
    )
    .toBeGreaterThan(0)
})

test('anon tidak bisa tulis /api/products (401)', async ({ request }) => {
  const res = await request.post('/api/products', {
    data: { name: 'Serangan', price: 1000 },
  })

  expect([401, 403]).toContain(res.status())
})

test('anon tidak bisa baca sampah /api/products/deleted (401)', async ({ request }) => {
  const res = await request.get('/api/products/deleted')

  expect([401, 403]).toContain(res.status())
})

test('katalog publik tetap bisa dibaca anon', async ({ request }) => {
  const res = await request.get('/api/products?from=0&to=1')

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('success')
  expect(Array.isArray(body.data)).toBe(true)
})

test('banner demo autofill mengisi kredensial pelanggan dan admin secara instan', async ({
  page,
}) => {
  await page.goto('/auth/login')
  await waitForHydration(page)

  const customerDemoBtn = page.locator('button[aria-label*="demo-customer@shelfstack.local"]')
  await expect(customerDemoBtn).toBeVisible()

  await expect
    .poll(
      async () => {
        await customerDemoBtn.click()
        return await page.getByPlaceholder('nama@email.com').inputValue()
      },
      { timeout: 15000 },
    )
    .toBe('demo-customer@shelfstack.local')

  await expect(page.locator('input[type="password"]')).toHaveValue('Password123!')

  const adminDemoBtn = page.locator('button[aria-label*="demo-admin@shelfstack.local"]')
  await expect
    .poll(
      async () => {
        await adminDemoBtn.click()
        return await page.getByPlaceholder('nama@email.com').inputValue()
      },
      { timeout: 15000 },
    )
    .toBe('demo-admin@shelfstack.local')

  await expect(page.locator('input[type="password"]')).toHaveValue('Password123!')
})
