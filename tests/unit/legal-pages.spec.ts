import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import TermsPage from '~/pages/terms.vue'
import PrivacyPage from '~/pages/privacy.vue'

const { mockSeoMeta } = await vi.hoisted(async () => ({
  mockSeoMeta: vi.fn(),
}))

mockNuxtImport('useSeoMeta', () => mockSeoMeta)

const globalStubs = {
  NuxtLink: {
    template: '<a :href="to" :data-to="to"><slot /></a>',
    props: ['to'],
  },
  UiButton: {
    template: `
      <NuxtLink
        v-if="to"
        :to="to"
        class="ui-button"
        :data-variant="variant"
      >
        <slot />
      </NuxtLink>
      <button
        v-else
        :type="type || 'button'"
        :disabled="disabled || loading"
      >
        <slot />
      </button>
    `,
    props: ['type', 'variant', 'to', 'size', 'icon', 'iconPos', 'loading', 'disabled', 'block'],
  },
}

describe('Legal Pages: Syarat & Ketentuan (app/pages/terms.vue)', () => {
  beforeEach(() => {
    mockSeoMeta.mockClear()
  })

  it('merender judul, subjudul, dan konfigurasi useSeoMeta yang tepat', () => {
    const wrapper = mount(TermsPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('Syarat & Ketentuan Layanan')
    expect(text).toContain(
      'Ketentuan hukum dan kesepakatan penggunaan platform e-commerce ShelfStack',
    )
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Syarat & Ketentuan - ShelfStack',
      }),
    )
  })

  it('merender seluruh 6 klausul bernomor secara berurutan', () => {
    const wrapper = mount(TermsPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('01')
    expect(text).toContain('Ketentuan Umum & Definisi Akun')

    expect(text).toContain('02')
    expect(text).toContain('Pemesanan & Transaksi Pembayaran')

    expect(text).toContain('03')
    expect(text).toContain('Kupon Promo & Pembatasan Kuota')

    expect(text).toContain('04')
    expect(text).toContain('Pengiriman & Risiko Kehilangan')

    expect(text).toContain('05')
    expect(text).toContain('Garansi & Batasan Tanggung Jawab')

    expect(text).toContain('06')
    expect(text).toContain('Hak Kekayaan Intelektual & Hukum yang Berlaku')
  })

  it('memuat klausul penting transaksi: Midtrans Snap, penguncian stok, keabsahan harga, dan hukum RI', () => {
    const wrapper = mount(TermsPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('Midtrans Snap')
    expect(text).toContain('penguncian stok')
    expect(text).toContain('keabsahan harga')
    expect(text).toContain('tanggung jawab ekspedisi & asuransi')
    expect(text).toContain('video unboxing')
    expect(text).toContain('garansi resmi')
    expect(text).toContain('hukum Republik Indonesia')
  })

  it('merender tautan kontak cepat ke /contact dan /help di akhir halaman', () => {
    const wrapper = mount(TermsPage, {
      global: { stubs: globalStubs },
    })

    const contactLink = wrapper.find('a[href="/contact"]')
    expect(contactLink.exists()).toBe(true)
    expect(contactLink.text()).toContain('Hubungi Kami')

    const helpLink = wrapper.find('a[href="/help"]')
    expect(helpLink.exists()).toBe(true)
    expect(helpLink.text()).toContain('Pusat Bantuan')
  })
})

describe('Legal Pages: Kebijakan Privasi (app/pages/privacy.vue)', () => {
  beforeEach(() => {
    mockSeoMeta.mockClear()
  })

  it('merender judul, subjudul, dan konfigurasi useSeoMeta yang tepat', () => {
    const wrapper = mount(PrivacyPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('Kebijakan Privasi & Perlindungan Data')
    expect(text).toContain('Komitmen transparansi dan keamanan privasi data pengguna ShelfStack')
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Kebijakan Privasi - ShelfStack',
      }),
    )
  })

  it('merender seluruh 5 bagian kebijakan privasi secara terstruktur', () => {
    const wrapper = mount(PrivacyPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('01')
    expect(text).toContain('Informasi yang Kami Kumpulkan')

    expect(text).toContain('02')
    expect(text).toContain('Penggunaan Informasi')

    expect(text).toContain('03')
    expect(text).toContain('Keamanan & Enkripsi Data')

    expect(text).toContain('04')
    expect(text).toContain('Hak Pengguna atas Data Pribadi')

    expect(text).toContain('05')
    expect(text).toContain('Penggunaan Cookie & Sesi Belanja')
  })

  it('memuat jaminan keamanan data: data profil, alamat, riwayat pesanan, Supabase RLS, JWT, dan cookie sesi', () => {
    const wrapper = mount(PrivacyPage, {
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('data profil')
    expect(text).toContain('alamat pengiriman')
    expect(text).toContain('riwayat pesanan')
    expect(text).toContain('pemrosesan pesanan')
    expect(text).toContain('notifikasi transaksi')
    expect(text).toContain('pengiriman kurir')
    expect(text).toContain('PostgreSQL Row-Level Security')
    expect(text).toContain('otentikasi JWT Supabase')
    expect(text).toContain('gerbang pembayaran terenkripsi')
    expect(text).toContain('penghapusan akun via dukungan')
    expect(text).toContain('penyimpanan keranjang dan sesi lokal')
  })

  it('merender tautan kontak cepat ke /contact untuk kebutuhan privasi', () => {
    const wrapper = mount(PrivacyPage, {
      global: { stubs: globalStubs },
    })

    const contactLink = wrapper.find('a[href="/contact"]')
    expect(contactLink.exists()).toBe(true)
    expect(contactLink.text()).toContain('Hubungi Tim Dukungan')
  })
})

describe('Antislop Compliance: Bebas Em Dash', () => {
  it('memverifikasi tidak ada karakter em dash pada template kedua halaman', () => {
    const termsWrapper = mount(TermsPage, {
      global: { stubs: globalStubs },
    })
    const privacyWrapper = mount(PrivacyPage, {
      global: { stubs: globalStubs },
    })

    expect(termsWrapper.html()).not.toMatch(/[\u2014]|&mdash;/)
    expect(privacyWrapper.html()).not.toMatch(/[\u2014]|&mdash;/)
  })
})
