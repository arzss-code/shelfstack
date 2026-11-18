import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HomeReviews from '~/components/home/HomeReviews.vue'
import HomePromoCTA from '~/components/home/HomePromoCTA.vue'
import HomeAssurances from '~/components/home/HomeAssurances.vue'
import HomeFeatures from '~/components/home/HomeFeatures.vue'

// Mock useAuth composable
const mockAuthState = {
  isLoggedIn: ref(false),
  isAdmin: ref(false),
}

vi.mock('~/features/auth/composables/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

const mockReviews = [
  {
    id: 'rev-001',
    product_id: 101,
    product_name: 'Headphone Studio ANC',
    product_slug: 'headphone-studio-anc',
    product_image_url: 'https://images.example.com/audio.jpg',
    rating: 5,
    review_text: 'Kualitas audio sangat detail dan peredam bising aktif bekerja sempurna.',
    reviewer_name: 'Budi S.',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'rev-002',
    product_id: 102,
    product_name: 'Tas Komuter EDC Ballistic',
    product_slug: 'tas-komuter-edc',
    product_image_url: 'https://images.example.com/bag.jpg',
    rating: 5,
    review_text: 'Material nilon Cordura kokoh dan kompartemen laptop terlindungi aman.',
    reviewer_name: 'Siti R.',
    created_at: '2026-11-02T11:00:00Z',
  },
]

const globalStubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}

describe('Storefront Craft & Copywriting Suite', () => {
  beforeEach(() => {
    mockAuthState.isLoggedIn.value = false
    mockAuthState.isAdmin.value = false
  })

  describe('HomeReviews Component', () => {
    it('merender header standar kualitas dan empat pilar komitmen resmi', () => {
      const wrapper = mount(HomeReviews, {
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.text()).toContain('Standar Kualitas & Kepuasan Pelanggan ShelfStack')
      expect(wrapper.text()).toContain('Kurasi Fisik 100% Asli')
      expect(wrapper.text()).toContain('Jaminan Pengembalian 7 Hari')
      expect(wrapper.text()).toContain('Pengemasan Tahan Benturan')
      expect(wrapper.text()).toContain('Layanan Pelanggan Responsif')

      const cards = wrapper.findAll('[data-testid="trust-commitment-card"]')
      expect(cards).toHaveLength(4)
    })

    it('merender ulasan pembeli terverifikasi saat data initialReviews tersedia', () => {
      const wrapper = mount(HomeReviews, {
        props: {
          initialReviews: mockReviews,
        },
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.find('[data-testid="featured-reviews-block"]').exists()).toBe(true)
      const reviewCards = wrapper.findAll('[data-testid="featured-review-card"]')
      expect(reviewCards).toHaveLength(2)

      // Cek reviewer pertama
      expect(reviewCards[0].text()).toContain('Budi S.')
      expect(reviewCards[0].text()).toContain('Pembeli Terverifikasi')
      expect(reviewCards[0].text()).toContain(
        'Kualitas audio sangat detail dan peredam bising aktif bekerja sempurna.',
      )
      expect(reviewCards[0].text()).toContain('Headphone Studio ANC')

      // Cek tautan produk
      const productLink = reviewCards[0].find('a')
      expect(productLink.attributes('href')).toBe('/product/headphone-studio-anc')
    })
  })

  describe('HomePromoCTA Component', () => {
    it('merender heading penawaran pelanggan baru dan badge voucher WELCOME10', () => {
      const wrapper = mount(HomePromoCTA, {
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.text()).toContain('Hemat 10% untuk Pesanan Pertamamu')
      expect(wrapper.text()).toContain('WELCOME10')
      expect(wrapper.text()).toContain('Diskon 10% Pesanan Pertama')
      expect(wrapper.text()).toContain('Bebas Ongkir min. Rp500.000')

      const voucherLink = wrapper.find('a[href="/promos"]')
      expect(voucherLink.exists()).toBe(true)
      expect(voucherLink.text()).toContain('Lihat Voucher')

      const loginLink = wrapper.find('a[href="/auth/login"]')
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.text()).toBe('Masuk')
    })

    it('menampilkan navigasi khusus admin saat login sebagai admin', async () => {
      mockAuthState.isLoggedIn.value = true
      mockAuthState.isAdmin.value = true

      const wrapper = mount(HomePromoCTA, {
        global: {
          stubs: globalStubs,
        },
      })

      const adminLink = wrapper.find('a[href="/admin/products"]')
      expect(adminLink.exists()).toBe(true)
      expect(adminLink.text()).toContain('Kelola Produk (Admin)')
    })

    it('menampilkan jelajahi katalog saat login sebagai customer', async () => {
      mockAuthState.isLoggedIn.value = true
      mockAuthState.isAdmin.value = false

      const wrapper = mount(HomePromoCTA, {
        global: {
          stubs: globalStubs,
        },
      })

      const catalogLink = wrapper.find('a[href="/katalog"]')
      expect(catalogLink.exists()).toBe(true)
      expect(catalogLink.text()).toContain('Jelajahi Katalog')
    })
  })

  describe('HomeAssurances Component', () => {
    it('merender empat pilar jaminan belanja dengan teks yang jelas dan anti-slop', () => {
      const wrapper = mount(HomeAssurances)
      const text = wrapper.text()

      expect(text).toContain('100% Produk Original')
      expect(text).toContain('Gratis Ongkir Se-Indonesia')
      expect(text).toContain('Garansi Retur 7 Hari')
      expect(text).toContain('Layanan Bantuan 24/7')
    })
  })

  describe('HomeFeatures Component', () => {
    it('merender pilar keunggulan ShelfStack dengan heading Kenapa ShelfStack', () => {
      const wrapper = mount(HomeFeatures)
      const text = wrapper.text()

      expect(text).toContain('Kenapa ShelfStack')
      expect(text).toContain('Kurasi Kualitas Terpilih')
      expect(text).toContain('Transaksi Aman & Terlindungi')
      expect(text).toContain('Pengiriman Cepat & Lacak Realtime')
    })
  })
})
