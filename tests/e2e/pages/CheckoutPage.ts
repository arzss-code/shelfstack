import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export interface ShippingAddressData {
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note?: string
}

export class CheckoutPage extends BasePage {
  readonly heading: Locator
  readonly authRequiredCard: Locator
  readonly loginRedirectButton: Locator
  readonly emptyCartCard: Locator
  readonly nameInput: Locator
  readonly phoneInput: Locator
  readonly streetInput: Locator
  readonly noteInput: Locator
  readonly submitButton: Locator
  readonly orderSummary: Locator
  readonly billDetails: Locator
  readonly openLocationPickerButton: Locator
  readonly locationSearchInput: Locator
  readonly searchResultItems: Locator
  readonly changeLocationButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: /^checkout/i })
    this.authRequiredCard = page.getByText('Login Diperlukan')
    this.loginRedirectButton = page.getByRole('link', { name: 'Masuk ke Akun' })
    this.emptyCartCard = page.getByText('Keranjang Belanja Kosong')
    this.nameInput = page.getByPlaceholder(/cth. (Arya Santoso|Atsiila Arya)/i)
    this.phoneInput = page.getByPlaceholder('cth. 081234567890')
    this.streetInput = page.getByPlaceholder(/cth. Jl. Sudirman/i)
    this.noteInput = page.getByPlaceholder(/titipkan ke satpam/i)
    this.submitButton = page.getByRole('button', { name: /bayar sekarang|memproses pesanan/i })
    this.orderSummary = page.locator('aside')
    this.billDetails = page.locator('aside').getByText(/total tagihan/i)
    this.openLocationPickerButton = page.locator('[data-testid="open-location-picker-btn"]')
    this.locationSearchInput = page.locator('[data-testid="location-search-input"]')
    this.searchResultItems = page.locator('[data-testid="search-result-item"]')
    this.changeLocationButton = page.locator('[data-testid="change-location-btn"]')
  }

  get cityInput(): Locator {
    return this.page.getByPlaceholder('cth. Jakarta Pusat')
  }

  get postalInput(): Locator {
    return this.page.getByPlaceholder('cth. 10220')
  }

  async goto(): Promise<void> {
    await this.navigate('/checkout')
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15000 })
  }

  async assertAuthRequiredVisible(): Promise<void> {
    await expect(this.authRequiredCard).toBeVisible({ timeout: 10000 })
    await expect(this.loginRedirectButton).toBeVisible()
  }

  async assertEmptyCartVisible(): Promise<void> {
    await expect(this.emptyCartCard).toBeVisible({ timeout: 10000 })
  }

  async selectAdministrativeLocation(query: string = 'Jakarta Pusat'): Promise<void> {
    if (await this.openLocationPickerButton.isVisible()) {
      await this.openLocationPickerButton.click()
    } else if (await this.changeLocationButton.isVisible()) {
      await this.changeLocationButton.click()
    }
    await expect(this.locationSearchInput).toBeVisible({ timeout: 10000 })
    await this.locationSearchInput.fill(query)
    const firstResult = this.searchResultItems.first()
    await expect(firstResult).toBeVisible({ timeout: 10000 })
    await firstResult.click()
  }

  async fillShippingAddress(data: ShippingAddressData): Promise<void> {
    await this.nameInput.fill(data.name)
    await this.phoneInput.fill(data.phone)
    await this.streetInput.fill(data.street)
    if (data.city) {
      if (await this.cityInput.isVisible()) {
        await this.cityInput.fill(data.city)
      } else {
        await this.selectAdministrativeLocation(data.city)
      }
    }
    if (data.postal && (await this.postalInput.isVisible())) {
      await this.postalInput.fill(data.postal)
    }
    if (data.note) {
      await this.noteInput.fill(data.note)
    }
  }

  async submitOrder(): Promise<void> {
    await expect(this.submitButton).toBeVisible({ timeout: 15000 })
    await this.submitButton.click()
  }

  async assertValidationError(message: string | RegExp): Promise<void> {
    await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 10000 })
  }

  async assertOrderSummaryVisible(): Promise<void> {
    await expect(this.orderSummary).toBeVisible()
    await expect(this.billDetails).toBeVisible()
  }
}
