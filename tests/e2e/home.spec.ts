import { test, expect } from '@playwright/test'

test('has title and main heading', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Katalog \| Simple Product CRUD/)

  // Expect the main heading to be visible
  const heading = page.getByRole('heading', { name: 'Daftar Produk' })
  await expect(heading).toBeVisible()
})

test('can open add product modal', async ({ page }) => {
  await page.goto('/')

  // Click the add button
  const addButton = page.getByRole('button', { name: 'Tambah Produk' })
  await addButton.click()

  // Wait for modal to appear
  const modalHeading = page.getByRole('heading', { name: 'Tambah Produk', exact: true })
  await expect(modalHeading).toBeVisible()
})
