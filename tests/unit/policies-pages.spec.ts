import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShippingPage from '~/pages/shipping.vue'
import ReturnsPage from '~/pages/returns.vue'

const { mockSeoMeta } = await vi.hoisted(async () => ({
  mockSeoMeta: vi.fn(),
}))

mockNuxtImport('useSeoMeta', () => mockSeoMeta)

const globalStubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
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
    props: ['type', 'variant', 'to', 'size', 'icon', 'iconPos', 'loading', 'disabled'],
  },
}

describe('Shipping Page (app/pages/shipping.vue)', () => {
  beforeEach(() => {
    mockSeoMeta.mockClear()
  })

  it('mengonfigurasi metadata SEO dengan judul yang tepat', () => {
    mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Informasi Pengiriman - ShelfStack',
      }),
    )
  })

  it('merender judul halaman dan subjudul panduan ekspedisi', () => {
    const wrapper = mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Informasi Pengiriman & Ekspedisi')
    expect(text).toContain(
      'Panduan estimasi pengiriman, proteksi paket, dan opsi kurir resmi ShelfStack',
    )
    expect(text).toContain('Standar Logistik')
  })

  it('merender 3 kartu fitur keunggulan pengiriman dengan deskripsi lengkap', () => {
    const wrapper = mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()

    // Kartu 1: Gratis Ongkir Nasional
    expect(text).toContain('Gratis Ongkir Nasional')
    expect(text).toContain(
      'Bebas biaya kirim untuk pesanan di atas Rp 500.000 ke seluruh Indonesia.',
    )

    // Kartu 2: Standar Kemasan Studio
    expect(text).toContain('Standar Kemasan Studio')
    expect(text).toContain(
      'Perlindungan ganda: bubble wrap tebal, kardus berlabel fragile, dan asuransi penuh untuk barang elektronik.',
    )

    // Kartu 3: Kurir Resmi Terverifikasi
    expect(text).toContain('Kurir Resmi Terverifikasi')
    expect(text).toContain('JNE, SiCepat, J&T dengan pelacakan nomor resi otomatis.')
  })

  it('merender tabel estimasi waktu tiba untuk Jabodetabek, Pulau Jawa, dan Luar Jawa', () => {
    const wrapper = mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Estimasi Waktu Tiba')

    // Jabodetabek
    expect(text).toContain('Jabodetabek')
    expect(text).toContain('1-2 hari kerja')

    // Pulau Jawa
    expect(text).toContain('Pulau Jawa')
    expect(text).toContain('2-3 hari kerja')

    // Luar Pulau Jawa
    expect(text).toContain('Luar Pulau Jawa')
    expect(text).toContain('3-5 hari kerja')
  })

  it('merender daftar mitra kurir resmi (JNE, SiCepat, J&T)', () => {
    const wrapper = mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Opsi Kurir Resmi ShelfStack')
    expect(text).toContain('JNE')
    expect(text).toContain('SiCepat')
    expect(text).toContain('J&T')
  })

  it('merender direct CTA strip dengan tombol ke /tracking dan /help', () => {
    const wrapper = mount(ShippingPage, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Ingin Cek Status Paket Anda?')

    const trackingLink = wrapper.find('a[href="/tracking"]')
    expect(trackingLink.exists()).toBe(true)
    expect(trackingLink.text()).toContain('Lacak Nomor Resi')

    const helpLink = wrapper.find('a[href="/help"]')
    expect(helpLink.exists()).toBe(true)
    expect(helpLink.text()).toContain('Lihat FAQ Pengiriman')
  })
})

describe('Returns Page (app/pages/returns.vue)', () => {
  beforeEach(() => {
    mockSeoMeta.mockClear()
  })

  it('mengonfigurasi metadata SEO dengan judul yang tepat', () => {
    mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Kebijakan Pengembalian & Garansi - ShelfStack',
      }),
    )
  })

  it('merender judul halaman dan subjudul kebijakan garansi', () => {
    const wrapper = mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Kebijakan Pengembalian & Garansi')
    expect(text).toContain('Jaminan kepuasan belanja dan komitmen perlindungan konsumen ShelfStack')
    expect(text).toContain('Proteksi Konsumen')
  })

  it('merender tiga jaminan utama (Retur 7 Hari, Garansi 2 Tahun, Pengembalian Dana Penuh)', () => {
    const wrapper = mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()

    // Jaminan 1: Retur 7 Hari
    expect(text).toContain('Jaminan Retur 7 Hari')
    expect(text).toContain(
      'Pengembalian atau penggantian unit jika terdapat cacat pabrik dalam 7 hari sejak diterima.',
    )

    // Jaminan 2: Garansi Resmi 2 Tahun
    expect(text).toContain('Garansi Resmi 2 Tahun')
    expect(text).toContain(
      'Perlindungan perbaikan atau penggantian komponen untuk seluruh perangkat keras kurasi.',
    )

    // Jaminan 3: Pengembalian Dana Penuh
    expect(text).toContain('Pengembalian Dana Penuh')
    expect(text).toContain(
      'Refund 100% via metode pembayaran awal jika unit pengganti tidak tersedia.',
    )
  })

  it('merender 4 tahapan alur pengembalian produk', () => {
    const wrapper = mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Tahapan Pengajuan Retur & Klaim Garansi')

    // Step 1
    expect(text).toContain('Ajukan Retur dari Pesanan')
    expect(text).toContain('Detail Pesanan di /orders')

    // Step 2
    expect(text).toContain('Verifikasi Bukti')
    expect(text).toContain('video unboxing tanpa jeda dan foto nomor seri')

    // Step 3
    expect(text).toContain('Kirimkan Produk ke Gudang')
    expect(text).toContain('gudang kurasi sentral di Semarang')

    // Step 4
    expect(text).toContain('Penggantian Unit atau Refund')
    expect(text).toContain('1-3 hari kerja pasca inspeksi fisik')
  })

  it('merender kriteria kelayakan retur produk', () => {
    const wrapper = mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Ketentuan Kelayakan Pengembalian')
    expect(text).toContain('Video Unboxing Lengkap')
    expect(text).toContain('Kelengkapan Orisinal')
    expect(text).toContain('Kondisi Bebas Modifikasi')
  })

  it('merender direct CTA strip dengan tombol ke /orders dan /help#pengembalian', () => {
    const wrapper = mount(ReturnsPage, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Ada Kendala dengan Produk Anda?')

    const ordersLink = wrapper.find('a[href="/orders"]')
    expect(ordersLink.exists()).toBe(true)
    expect(ordersLink.text()).toContain('Ajukan Pengembalian di Pesanan')

    const faqLink = wrapper.find('a[href="/help#pengembalian"]')
    expect(faqLink.exists()).toBe(true)
    expect(faqLink.text()).toContain('Pelajari FAQ')
  })
})
