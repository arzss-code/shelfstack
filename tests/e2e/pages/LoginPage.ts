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
  }

  async loginAsCustomer(password = 'Password123!'): Promise<void> {
    await this.login('customer@shelfstack.local', password)
  }

  async loginAsAdmin(password = 'Password123!'): Promise<void> {
    await this.login('admin@shelfstack.local', password)
  }

  async assertErrorMessageVisible(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 10000 })
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }
}
