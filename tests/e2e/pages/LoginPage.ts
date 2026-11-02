/// <reference types="node" />
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  readonly heading: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Masuk' })
    this.emailInput = page.getByPlaceholder('nama@email.com')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitButton = page.locator('form').getByRole('button', { name: 'Masuk' })
    this.registerLink = page.getByRole('link', { name: /Daftar|buat akun/i })
  }

  async goto(): Promise<void> {
    await this.navigate('/auth/login')
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
    await this.awaitLoginResult()
  }

  /**
   * Tunggu hasil login. Jika halaman stagnan di /auth/login tanpa toast error
   * (klik jatuh pre-hydration dan tidak memicu submit), kirim ulang sekali
   * secara terbatas. Kegagalan kredensial asli tetap dilempar sebagai error.
   */
  async awaitLoginResult(): Promise<void> {
    try {
      await expect(this.page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 })
      return
    } catch {
      const rejected = await this.page.getByText('Gagal Masuk').count()
      if (rejected > 0) {
        throw new Error('Login ditolak server. Periksa kredensial E2E.')
      }
      await this.submit()
      await expect(this.page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 })
    }
  }

  async loginAsCustomer(
    password = process.env.E2E_CUSTOMER_PASSWORD || 'Password123!',
  ): Promise<void> {
    await this.login(process.env.E2E_CUSTOMER_EMAIL || 'customer@shelfstack.local', password)
  }

  async loginAsAdmin(password = process.env.E2E_ADMIN_PASSWORD || 'Password123!'): Promise<void> {
    await this.login(process.env.E2E_ADMIN_EMAIL || 'admin@shelfstack.local', password)
  }

  async assertErrorMessageVisible(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 10000 })
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
    await expect(this.emailInput).toBeVisible({ timeout: 15000 })
    await expect(this.submitButton).toBeVisible({ timeout: 15000 })
  }
}
