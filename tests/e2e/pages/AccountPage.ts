import { type Locator, type Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AccountPage extends BasePage {
  // Navigation Tabs
  readonly profileTab: Locator
  readonly addressesTab: Locator
  readonly ordersTab: Locator

  // Profile Section
  readonly fullNameInput: Locator
  readonly saveNameButton: Locator
  readonly newEmailInput: Locator
  readonly saveEmailButton: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly savePasswordButton: Locator

  // Addresses Section
  readonly addAddressButton: Locator
  readonly addressCards: Locator
  readonly recipientNameInput: Locator
  readonly recipientPhoneInput: Locator
  readonly streetInput: Locator
  readonly cityInput: Locator
  readonly postalInput: Locator
  readonly saveAddressButton: Locator

  constructor(page: Page) {
    super(page)

    this.profileTab = page
      .getByRole('link', { name: /profil saya|biodata diri|profil akun/i })
      .first()
    this.addressesTab = page.getByRole('link', { name: /daftar alamat|buku alamat/i }).first()
    this.ordersTab = page.getByRole('link', { name: /pesanan saya/i }).first()

    this.fullNameInput = page.getByLabel(/nama lengkap/i).first()
    this.saveNameButton = page.getByRole('button', {
      name: /simpan profil|simpan perubahan|simpan biodata|simpan nama/i,
    })
    this.newEmailInput = page.getByLabel(/ganti dengan email baru/i)
    this.saveEmailButton = page.getByRole('button', { name: /perbarui email/i })
    this.newPasswordInput = page.getByLabel(/kata sandi baru/i).first()
    this.confirmPasswordInput = page.getByLabel(/konfirmasi kata sandi baru/i)
    this.savePasswordButton = page.getByRole('button', { name: /simpan kata sandi/i })

    this.addAddressButton = page.getByRole('button', { name: /tambah alamat baru/i })
    this.addressCards = page.locator('main').locator('.rounded-card')
    this.recipientNameInput = page.getByLabel(/nama penerima/i)
    this.recipientPhoneInput = page.getByLabel(/nomor telepon/i)
    this.streetInput = page.getByLabel(/alamat lengkap/i)
    this.cityInput = page.getByLabel(/kota \/ wilayah/i)
    this.postalInput = page.getByLabel(/kode pos/i)
    this.saveAddressButton = page.getByRole('button', { name: /tambah alamat|simpan perubahan/i })
  }

  async gotoProfile(): Promise<void> {
    await this.navigate('/account/profile')
    await this.assertProfileLoaded()
  }

  async gotoAddresses(): Promise<void> {
    await this.navigate('/account/addresses')
    await expect(this.addressesTab).toBeVisible()
  }

  async assertProfileLoaded(): Promise<void> {
    await expect(this.profileTab).toBeVisible()
    await expect(this.fullNameInput).toBeVisible()
    await expect(this.saveNameButton).toBeVisible()
  }

  async updateName(newName: string): Promise<void> {
    await this.fullNameInput.fill('')
    await this.fullNameInput.fill(newName)
    await this.saveNameButton.click()
  }

  async openAddAddressModal(): Promise<void> {
    await this.addAddressButton.click()
    await expect(this.recipientNameInput).toBeVisible()
  }

  async fillAddressForm(data: {
    name: string
    phone: string
    street: string
    city: string
    postal: string
  }): Promise<void> {
    await this.recipientNameInput.fill(data.name)
    await this.recipientPhoneInput.fill(data.phone)
    await this.streetInput.fill(data.street)
    await this.cityInput.fill(data.city)
    await this.postalInput.fill(data.postal)
  }

  async submitAddressForm(): Promise<void> {
    await this.saveAddressButton.click()
  }
}
