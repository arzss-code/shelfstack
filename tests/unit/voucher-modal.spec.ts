import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import CartCouponInput from '../../app/components/cart/CartCouponInput.vue'
import VoucherSelectModal from '../../app/components/cart/VoucherSelectModal.vue'
import { useCartStore, type AppliedCoupon } from '../../app/features/cart/stores/cart'

const mockCoupons = [
  {
    id: 'c1',
    code: 'SHELF10',
    name: 'Diskon 10%',
    description: 'Diskon 10% minimal belanja Rp 200.000',
    discount_type: 'percentage',
    discount_value: 10,
    formatted_discount: 'Diskon 10%',
    max_discount_cents: 10000000,
    formatted_max_discount: 'Rp 100.000',
    min_purchase_cents: 20000000,
    formatted_min_purchase: 'Rp 200.000',
    usage_limit: 100,
    usage_count: 5,
    remaining_quota: 95,
    user_limit: 1,
    starts_at: null,
    expires_at: '2026-12-31T23:59:59Z',
    is_expired: false,
    is_available: true,
  },
  {
    id: 'c2',
    code: 'HEMAT50K',
    name: 'Potongan Rp 50.000',
    description: 'Potongan Rp 50.000 minimal belanja Rp 500.000',
    discount_type: 'fixed',
    discount_value: 5000000,
    formatted_discount: 'Potongan Rp 50.000',
    max_discount_cents: null,
    formatted_max_discount: null,
    min_purchase_cents: 50000000,
    formatted_min_purchase: 'Rp 500.000',
    usage_limit: 50,
    usage_count: 5,
    remaining_quota: 45,
    user_limit: 1,
    starts_at: null,
    expires_at: '2026-12-31T23:59:59Z',
    is_expired: false,
    is_available: true,
  },
]

const mockValidateCoupon = {
  code: 'SUPERVIP',
  name: 'Diskon VIP 20%',
  description: 'Khusus member VIP',
  discount_type: 'percentage',
  discount_value: 20,
  max_discount_cents: 50000000,
  min_purchase_cents: 10000000,
  discount_cents: 6000000,
  formatted_discount: 'Diskon 20%',
  final_total_cents: 24000000,
}

const { mockFetch, toastAddMock } = vi.hoisted(() => {
  const tMock = vi.fn()
  const fMock: any = vi
    .fn()
    .mockImplementation((url: string, opts?: { method?: string; body?: { code?: string } }) => {
      if (url === '/api/coupons') {
        return Promise.resolve({ status: 'success', data: mockCoupons })
      }
      if (url === '/api/coupons/validate') {
        if (opts?.body?.code === 'SUPERVIP') {
          return Promise.resolve({ status: 'success', data: mockValidateCoupon })
        }
        return Promise.reject({ data: { message: 'Kode voucher tidak valid.' } })
      }
      if (url === '/api/account/vouchers/claim') {
        return Promise.resolve({
          status: 'success',
          message: 'Voucher berhasil diklaim',
          data: null,
        })
      }
      return Promise.resolve({ status: 'success', data: [] })
    })
  fMock.create = () => fMock
  fMock.raw = vi.fn()
  return { mockFetch: fMock, toastAddMock: tMock }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)
vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

mockNuxtImport('useUiToast', () => () => ({
  add: toastAddMock,
  remove: vi.fn(),
  clear: vi.fn(),
  show: toastAddMock,
}))

const globalStubs = {
  UiModal: {
    template: `
      <div v-if="visible" class="ui-modal-stub">
        <div class="modal-header">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['visible', 'title', 'description', 'size'],
  },
  UiInput: {
    template: `
      <div class="ui-input-stub">
        <input
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="$emit('update:modelValue', $event.target.value)"
          @keydown.enter="$emit('keydown', $event)"
        />
        <span v-if="error" class="ui-input-error">{{ error }}</span>
      </div>
    `,
    props: ['modelValue', 'placeholder', 'disabled', 'error', 'size', 'leftIcon'],
    emits: ['update:modelValue', 'keydown'],
  },
  UiButton: {
    template: `
      <button
        class="ui-button-stub"
        :disabled="disabled || loading"
        @click="$emit('click', $event)"
      >
        <slot />
      </button>
    `,
    props: ['variant', 'size', 'loading', 'disabled', 'icon', 'block'],
  },
  UiTooltip: {
    template: '<div class="ui-tooltip-stub"><slot /></div>',
    props: ['text', 'position'],
  },
  UiAlert: {
    template: '<div class="ui-alert-stub" :data-tone="tone"><slot /></div>',
    props: ['tone', 'title'],
  },
  UiEmptyState: {
    template: '<div class="ui-empty-state-stub">{{ title }}</div>',
    props: ['icon', 'title', 'description'],
  },
}

describe('CartCouponInput & VoucherSelectModal Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('CartCouponInput Trigger', () => {
    it('menampilkan trigger tombol bergaya Tokopedia/Shopee ketika belum ada voucher', () => {
      const cart = useCartStore()
      expect(cart.appliedCoupon).toBeNull()

      const wrapper = mount(CartCouponInput, {
        props: { compact: false },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Gunakan / Masukkan Voucher')
      expect(wrapper.text()).toContain('Pilih')
      expect(wrapper.find('.pi-ticket').exists()).toBe(true)
      expect(wrapper.find('.pi-chevron-right').exists()).toBe(true)
    })

    it('menampilkan pill voucher aktif dengan tombol Ubah dan Hapus ketika voucher terpasang', () => {
      const cart = useCartStore()
      const sampleCoupon: AppliedCoupon = {
        code: 'SHELF10',
        name: 'Diskon Spesial 10%',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_cents: 10000000,
        min_purchase_cents: 20000000,
        discount_cents: 3000000,
        formatted_discount: 'Rp 30.000',
      }
      cart.addItem({
        productId: 1,
        name: 'Produk A',
        price: 300000,
        priceCents: 30000000,
        stock: 10,
        quantity: 1,
        openCartDrawer: false,
      })
      cart.applyCoupon(sampleCoupon)

      const wrapper = mount(CartCouponInput, {
        props: { compact: false },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('SHELF10')
      expect(wrapper.text()).toContain('Ubah')
      expect(wrapper.find('button[aria-label="Hapus voucher promo"]').exists()).toBe(true)
    })

    it('dapat menghapus kupon aktif secara langsung dari tombol hapus', async () => {
      const cart = useCartStore()
      const sampleCoupon: AppliedCoupon = {
        code: 'SHELF10',
        name: 'Diskon 10%',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_cents: 10000000,
        min_purchase_cents: 20000000,
        discount_cents: 3000000,
        formatted_discount: 'Rp 30.000',
      }
      cart.applyCoupon(sampleCoupon)

      const wrapper = mount(CartCouponInput, {
        props: { compact: true },
        global: { stubs: globalStubs },
      })

      const removeBtn = wrapper.find('button[aria-label="Hapus voucher promo"]')
      await removeBtn.trigger('click')

      expect(cart.appliedCoupon).toBeNull()
      expect(toastAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'Voucher Dihapus',
        }),
      )
    })

    it('menampilkan peringatan jika subtotal belanja di bawah syarat minimum pembelian voucher', () => {
      const cart = useCartStore()
      const sampleCoupon: AppliedCoupon = {
        code: 'SHELF10',
        name: 'Diskon 10%',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_cents: 10000000,
        min_purchase_cents: 50000000, // Rp 500.000
        discount_cents: 0,
        formatted_discount: 'Rp 0',
      }
      cart.addItem({
        productId: 1,
        name: 'Produk Kecil',
        price: 100000,
        priceCents: 10000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })
      cart.applyCoupon(sampleCoupon)

      const wrapper = mount(CartCouponInput, {
        props: { compact: false },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Tambah belanjaan hingga')
      expect(wrapper.text()).toContain('Rp')
      expect(wrapper.text()).toContain('500.000')
    })
  })

  describe('VoucherSelectModal Component', () => {
    it('memuat kupon aktif dan memisahkan voucher eligible vs ineligible', async () => {
      const cart = useCartStore()
      // Subtotal Rp 300.000:
      // SHELF10 (min Rp 200.000) -> ELIGIBLE
      // HEMAT50K (min Rp 500.000) -> INELIGIBLE (Kurang Rp 200.000)
      cart.addItem({
        productId: 1,
        name: 'Meja Kerja Minimalis',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith('/api/coupons')
      expect(wrapper.text()).toContain('Pilih Voucher & Promo')
      expect(wrapper.text()).toContain('Voucher Yang Bisa Digunakan')
      expect(wrapper.text()).toContain('SHELF10')
      expect(wrapper.text()).toContain('Belum Memenuhi Syarat')
      expect(wrapper.text()).toContain('HEMAT50K')
      // Memeriksa informasi kekurangan belanja:
      expect(wrapper.text()).toContain('Kurang')
      expect(wrapper.text()).toContain('200.000')
      expect(wrapper.text()).toContain('untuk menggunakan voucher ini.')
    })

    it('dapat memilih voucher yang memenuhi syarat dan mengonfirmasi pemakaian', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 1,
        name: 'Meja Kerja Minimalis',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      // Cari card voucher SHELF10
      const eligibleCards = wrapper.findAll('[role="button"]')
      const shelf10Card = eligibleCards.find((c) => c.text().includes('SHELF10'))
      expect(shelf10Card).toBeDefined()

      // Klik untuk memilih
      await shelf10Card!.trigger('click')

      // Cek ringkasan di footer (Diskon 10% dari Rp 300.000 = Rp 30.000)
      expect(wrapper.text()).toContain('Total Penghematan:')
      expect(wrapper.text()).toContain('30.000')

      // Klik tombol Gunakan Voucher
      const buttons = wrapper.findAll('.ui-button-stub')
      const applyBtn = buttons.find((b) => b.text().includes('Gunakan Voucher'))
      expect(applyBtn).toBeDefined()
      await applyBtn!.trigger('click')

      expect(cart.appliedCoupon).not.toBeNull()
      expect(cart.appliedCoupon?.code).toBe('SHELF10')
      expect(cart.discountCents).toBe(3000000)
      expect(toastAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Voucher Diterapkan',
        }),
      )
    })

    it('dapat memvalidasi dan memilih kode voucher manual', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 1,
        name: 'Produk Demo',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      const input = wrapper.find('input')
      await input.setValue('SUPERVIP')

      const buttons = wrapper.findAll('.ui-button-stub')
      const terapkanBtn = buttons.find((b) => b.text().includes('Terapkan'))
      expect(terapkanBtn).toBeDefined()
      await terapkanBtn!.trigger('click')

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/coupons/validate',
        expect.objectContaining({
          method: 'POST',
          body: {
            code: 'SUPERVIP',
            subtotal_cents: 30000000,
          },
        }),
      )

      expect(wrapper.text()).toContain('Voucher SUPERVIP berhasil diverifikasi dan dipilih.')
      expect(wrapper.text()).toContain('SUPERVIP')
    })

    it('menampilkan badge Paling Hemat pada voucher yang memberikan diskon terbesar', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 1,
        name: 'Meja Kerja Minimalis',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      // SHELF10 memberikan potongan 10% (Rp 30.000) dan berstatus eligible
      expect(wrapper.text()).toContain('Paling Hemat')
      const eligibleCards = wrapper.findAll('[role="button"]')
      const shelf10Card = eligibleCards.find((c) => c.text().includes('SHELF10'))
      expect(shelf10Card?.text()).toContain('Paling Hemat')
    })

    it('dapat beralih antara tab Promo Tersedia dan Voucher Saya', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 1,
        name: 'Meja Kerja',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      // Tab awal Promo Tersedia aktif
      expect(wrapper.text()).toContain('Promo Tersedia')
      expect(wrapper.text()).toContain('Voucher Saya')

      // Klik tab Voucher Saya
      const buttons = wrapper.findAll('button')
      const walletTabBtn = buttons.find((b) => b.text().includes('Voucher Saya'))
      expect(walletTabBtn).toBeDefined()
      await walletTabBtn!.trigger('click')

      // Di lingkungan tamu tanpa auth, tampil empty state untuk voucher saya
      expect(wrapper.text()).toContain('Masuk untuk Melihat Voucher Saya')

      // Klik tombol Jelajahi / Lihat Promo Tersedia dari empty state
      const switchBtn = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Lihat Promo Tersedia'))
      expect(switchBtn).toBeDefined()
      await switchBtn!.trigger('click')

      // Kembali ke tab Promo Tersedia
      expect(wrapper.text()).toContain('Voucher Yang Bisa Digunakan')
    })

    it('dapat mengeksekusi 1-klik Klaim & Pakai pada kartu promo publik', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 1,
        name: 'Meja Kerja',
        price: 300000,
        priceCents: 30000000,
        stock: 5,
        quantity: 1,
        openCartDrawer: false,
      })

      const wrapper = mount(VoucherSelectModal, {
        props: { visible: true },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      // Cari tombol Klaim & Pakai pada card SHELF10
      const buttons = wrapper.findAll('button')
      const claimAndApplyBtn = buttons.find((b) => b.text().includes('Klaim & Pakai'))
      expect(claimAndApplyBtn).toBeDefined()

      await claimAndApplyBtn!.trigger('click')
      await flushPromises()

      // Voucher langsung terpasang di cart
      expect(cart.appliedCoupon).not.toBeNull()
      expect(cart.appliedCoupon?.code).toBe('SHELF10')
      expect(cart.discountCents).toBe(3000000)
    })
  })
})
