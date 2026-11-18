import { test, expect } from '@playwright/test'
import { waitForHydration } from './helpers'

test('beranda: hero + CTA katalog', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/ShelfStack/)
  await expect(
    page.getByRole('heading', {
      name: 'Perlengkapan kerja dan ruang hidup yang dirancang tahan lama.',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lihat Katalog' })).toBeVisible()
})

test('beranda: CTA mengarah ke katalog', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('link', { name: 'Lihat Katalog' }).click()
  await expect(page).toHaveURL(/\/katalog/)
  await expect(page.getByRole('heading', { name: 'Katalog' })).toBeVisible()
})

test('beranda: bagian unggulan + admin CTA tampil', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Produk Unggulan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Kenapa ShelfStack' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Hemat 10% untuk Pesanan Pertamamu' }),
  ).toBeVisible()
  const ctaBand = page.locator('section', {
    has: page.getByRole('heading', { name: 'Hemat 10% untuk Pesanan Pertamamu' }),
  })
  await expect(ctaBand.getByRole('link', { name: 'Masuk' })).toBeVisible()
})

test('beranda: kartu kategori pilihan mengarah ke rute /c/[slug]', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  const firstCategoryCard = page.locator('[data-testid="featured-category-card"]').first()
  await expect(firstCategoryCard).toBeVisible()
  const href = await firstCategoryCard.getAttribute('href')
  expect(href).toMatch(/\/c\/[a-z]+/)

  await firstCategoryCard.click()
  await expect(page).toHaveURL(/\/c\//)
})
