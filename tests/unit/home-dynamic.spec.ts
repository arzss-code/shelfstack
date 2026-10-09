import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeFlashDeals from '~/components/home/HomeFlashDeals.vue'
import HomeReviews from '~/components/home/HomeReviews.vue'
import HomeFeaturedCategories from '~/components/home/HomeFeaturedCategories.vue'
import { calculateCountdownUntilMidnight, calculateCountdownUntil } from '~/utils/countdown'
import { formatRupiah } from '~/utils/format'
import type { Product } from '~/types/product'

// Mock product store untuk mengisolasi unit testing tanpa ketergantungan koneksi Supabase
const mockStoreState = {
  products: [] as Product[],
  loading: false,
  fetchProducts: vi.fn(),
}

vi.mock('~/features/products/stores/product', () => ({
  useProductStore: () => mockStoreState,
}))

const globalStubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}

describe('Home Dynamic Features & Integrity', () => {
  beforeEach(() => {
    mockStoreState.products = []
    mockStoreState.loading = false
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Countdown Timer Logic (calculateCountdownUntil & calculateCountdownUntilMidnight)', () => {
    it('menghitung sisa jam, menit, dan detik hingga target promo yang ditentukan dengan tepat', () => {
      const now = new Date(2026, 9, 9, 12, 0, 0)
      const targetPromo = new Date(2026, 9, 9, 14, 30, 45) // + 2 jam 30 menit 45 detik
      const result = calculateCountdownUntil(targetPromo, now)

      expect(result).not.toBeNull()
      expect(result?.hours).toBe('02')
      expect(result?.minutes).toBe('30')
      expect(result?.seconds).toBe('45')
      expect(result?.formatted).toBe('02 : 30 : 45')
    })

    it('mengembalikan null jika waktu promo tidak ditentukan atau sudah lewat (anti urgensi palsu)', () => {
      const now = new Date(2026, 9, 9, 12, 0, 0)
      const pastPromo = new Date(2026, 9, 9, 11, 0, 0)

      expect(calculateCountdownUntil(null, now)).toBeNull()
      expect(calculateCountdownUntil(undefined, now)).toBeNull()
      expect(calculateCountdownUntil(pastPromo, now)).toBeNull()
      expect(calculateCountdownUntil('invalid-date', now)).toBeNull()
    })

    it('menghitung sisa jam, menit, dan detik hingga tengah malam dengan tepat', () => {
      // 20:15:30 -> sisa 3 jam, 44 menit, 30 detik
      const mockDate = new Date(2026, 9, 9, 20, 15, 30)
      const result = calculateCountdownUntilMidnight(mockDate)

      expect(result.hours).toBe('03')
      expect(result.minutes).toBe('44')
      expect(result.seconds).toBe('30')
      expect(result.formatted).toBe('03 : 44 : 30')
      expect(result.totalSeconds).toBe(3 * 3600 + 44 * 60 + 30)
    })

    it('memformat angka satuan dengan padding nol (two digits)', () => {
      // 23:55:05 -> sisa 0 jam, 4 menit, 55 detik
      const mockDate = new Date(2026, 9, 9, 23, 55, 5)
      const result = calculateCountdownUntilMidnight(mockDate)

      expect(result.hours).toBe('00')
      expect(result.minutes).toBe('04')
      expect(result.seconds).toBe('55')
      expect(result.formatted).toBe('00 : 04 : 55')
    })
  })

  describe('HomeFlashDeals Component', () => {
    const mockProducts: Product[] = [
      {
        id: 101,
        name: 'Headphone Studio Monitor Pro',
        price: 2500000,
        price_cents: 250000000,
        stock: 5,
        image_url: 'https://images.example.com/audio.jpg',
        is_featured: true,
        rating: 4.8,
        review_count: 42,
      },
      {
        id: 102,
        name: 'Teko Leher Angsa Stainless',
        price: 850000,
        price_cents: 85000000,
        stock: 2,
        image_url: 'https://images.example.com/kettle.jpg',
        is_featured: false,
        sold_count: 50,
      },
      {
        id: 103,
        name: 'Buku Jurnal Kulit Asli',
        price: 175000,
        price_cents: 17500000,
        stock: 0,
        image_url: 'https://images.example.com/journal.jpg',
        is_featured: false,
      },
    ]

    it('memetakan data produk nyata dan memformat harga menggunakan formatRupiah', () => {
      const wrapper = mount(HomeFlashDeals, {
        props: {
          products: mockProducts,
          loading: false,
        },
        global: {
          stubs: globalStubs,
        },
      })

      const cards = wrapper.findAll('[data-testid="flash-deal-card"]')
      expect(cards).toHaveLength(3)

      // Cek produk pertama (rating nyata)
      expect(cards[0].text()).toContain('Headphone Studio Monitor Pro')
      expect(cards[0].find('[data-testid="deal-price"]').text()).toBe(formatRupiah(2500000))
      expect(cards[0].find('a').attributes('href')).toBe('/product/101')
      expect(cards[0].find('[data-testid="deal-badge"]').text()).toBe('Pilihan Unggulan')
      expect(cards[0].text()).toContain('4.8')
      expect(cards[0].text()).toContain('(42)')

      // Cek produk kedua (stok rendah <= 3 & sold_count)
      expect(cards[1].text()).toContain('Teko Leher Angsa Stainless')
      expect(cards[1].find('[data-testid="deal-price"]').text()).toBe(formatRupiah(850000))
      expect(cards[1].find('[data-testid="deal-badge"]').text()).toBe('Sisa 2')
      expect(cards[1].text()).toContain('Stok Tersedia')

      // Cek produk ketiga (stok habis)
      expect(cards[2].find('[data-testid="deal-badge"]').text()).toBe('Habis')
      expect(cards[2].text()).toContain('Stok Habis')
    })

    it('mengambil produk langsung dari Pinia productStore saat prop tidak diberikan', () => {
      mockStoreState.products = mockProducts
      mockStoreState.loading = false

      const wrapper = mount(HomeFlashDeals, {
        global: {
          stubs: globalStubs,
        },
      })

      const cards = wrapper.findAll('[data-testid="flash-deal-card"]')
      expect(cards.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Headphone Studio Monitor Pro')
    })

    it('menampilkan skeleton saat kondisi loading aktif', () => {
      const wrapper = mount(HomeFlashDeals, {
        props: {
          products: [],
          loading: true,
        },
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.find('[data-testid="flash-deals-skeleton"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="flash-deals-grid"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="flash-deals-empty"]').exists()).toBe(false)
    })

    it('menampilkan status kosong yang elegan saat tidak ada produk', () => {
      const wrapper = mount(HomeFlashDeals, {
        props: {
          products: [],
          loading: false,
        },
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.find('[data-testid="flash-deals-empty"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Penawaran Spesial Segera Hadir')
      expect(wrapper.find('[data-testid="flash-deals-grid"]').exists()).toBe(false)
    })

    it('menampilkan badge kurasi resmi dan TIDAK menampilkan timer jika promoEndsAt tidak ada (anti fake urgency)', () => {
      const wrapper = mount(HomeFlashDeals, {
        props: {
          products: mockProducts,
          loading: false,
          promoEndsAt: null,
        },
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.find('[data-testid="flash-deals-timer"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="flash-deals-curated-badge"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Koleksi Pilihan Resmi')
    })

    it('menampilkan dan memperbarui timer setiap detik jika promoEndsAt diberikan dari data backend', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
      const targetPromo = new Date(Date.now() + 3600 * 1000 * 2) // 2 jam ke depan

      const wrapper = mount(HomeFlashDeals, {
        props: {
          products: mockProducts,
          loading: false,
          promoEndsAt: targetPromo,
        },
        global: {
          stubs: globalStubs,
        },
      })

      const timerEl = wrapper.find('[data-testid="flash-deals-timer"]')
      expect(timerEl.exists()).toBe(true)
      expect(timerEl.text()).toMatch(/^\d{2}\s:\s\d{2}\s:\s\d{2}$/)

      // Majukan timer 3 detik
      vi.advanceTimersByTime(3000)
      expect(timerEl.text()).toMatch(/^\d{2}\s:\s\d{2}\s:\s\d{2}$/)

      // Unmount komponen untuk memastikan clearInterval terpanggil (mencegah memory leak)
      wrapper.unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('HomeReviews Component (Customer Trust & Brand Assurance)', () => {
    it('menampilkan komitmen keaslian dan standar kualitas tanpa ulasan fiktif', () => {
      const wrapper = mount(HomeReviews, {
        global: {
          stubs: globalStubs,
        },
      })

      expect(wrapper.text()).toContain('Standar Kualitas & Kepuasan Pelanggan ShelfStack')
      expect(wrapper.text()).toContain('Kurasi Fisik 100% Asli')
      expect(wrapper.text()).toContain('Jaminan Pengembalian 30 Hari')
      expect(wrapper.text()).toContain('Pengemasan Tahan Benturan')
      expect(wrapper.text()).toContain('Layanan Pelanggan Responsif')

      // Verifikasi TIDAK ADA testimoni rekayasa atau klaim palsu
      expect(wrapper.text()).not.toContain('Hendra Setiawan')
      expect(wrapper.text()).not.toContain('Sarah Lestari')
      expect(wrapper.text()).not.toContain('18.400+ pesanan terkirim')
    })
  })

  describe('HomeFeaturedCategories Component', () => {
    it('menampilkan kategori dinamis dan label koleksi tanpa angka statis palsu', () => {
      const customCats = [
        {
          id: 'cat-tech',
          name: 'Tech & Gadget',
          slug: 'tech',
          description: 'Audio dan perangkat pintar.',
        },
        {
          id: 'cat-home',
          name: 'Rumah & Dapur',
          slug: 'home',
          description: 'Peralatan seduh kopi.',
        },
      ]

      const wrapper = mount(HomeFeaturedCategories, {
        props: {
          customCategories: customCats,
        },
        global: {
          stubs: globalStubs,
        },
      })

      const cards = wrapper.findAll('[data-testid="featured-category-card"]')
      expect(cards).toHaveLength(2)

      // Memastikan angka statis '420 Produk' dan '310 Produk' tidak lagi digunakan
      expect(wrapper.text()).not.toContain('420 Produk')
      expect(wrapper.text()).not.toContain('310 Produk')

      // Menampilkan badge yang jujur saat belum ada produk terkait
      const badges = wrapper.findAll('[data-testid="category-badge"]')
      expect(badges[0].text()).toBe('Koleksi Terkurasi')
    })

    it('menghitung jumlah produk nyata saat tersedia di store per kategori', () => {
      mockStoreState.products = [
        {
          id: 1,
          name: 'Wireless Mouse',
          price: 300000,
          stock: 10,
          image_url: null,
          category_id: 'cat-tech',
        },
        {
          id: 2,
          name: 'Mechanical Keyboard',
          price: 900000,
          stock: 5,
          image_url: null,
          category_id: 'cat-tech',
        },
      ]

      const customCats = [
        {
          id: 'cat-tech',
          name: 'Tech & Gadget',
          slug: 'tech',
        },
      ]

      const wrapper = mount(HomeFeaturedCategories, {
        props: {
          customCategories: customCats,
        },
        global: {
          stubs: globalStubs,
        },
      })

      const badges = wrapper.findAll('[data-testid="category-badge"]')
      expect(badges[0].text()).toBe('2 Produk Tersedia')
    })
  })
})
