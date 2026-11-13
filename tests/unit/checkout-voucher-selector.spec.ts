import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import CheckoutVoucherSelector from '../../app/components/checkout/CheckoutVoucherSelector.vue'
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
    is_expired: false,
    is_available: true,
  },
]

const { mockFetch, toastAddMock } = vi.hoisted(() => {
  const tMock = vi.fn()
  const fMock: unknown = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/coupons') {
      return Promise.resolve({ status: 'success', data: mockCoupons })
    }
    return Promise.resolve({ status: 'success', data: [] })
  })
  const fetchFn = fMock as { create?: () => unknown; raw?: unknown }
  fetchFn.create = () => fetchFn
  fetchFn.raw = vi.fn()
  return { mockFetch: fetchFn, toastAddMock: tMock }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
}))

vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    add: toastAddMock,
    show: toastAddMock,
  }),
}))

vi.mock('~/features/auth/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref({ id: 'user-123', email: 'buyer@talenavi.id' }),
    profile: ref({ full_name: 'Atsiila Arya' }),
    isLoggedIn: ref(true),
  }),
}))

vi.mock('~/composables/useUserVouchers', () => ({
  useUserVouchers: () => ({
    claimedVouchers: ref([]),
    activeCount: ref(0),
    fetchVouchers: vi.fn().mockResolvedValue(undefined),
    claimVoucher: vi.fn().mockResolvedValue(true),
  }),
}))

const globalStubs = {
  UiModal: {
    template: '<div v-if="visible" class="ui-modal-stub"><slot /><slot name="footer" /></div>',
    props: ['visible'],
  },
  UiButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled'],
  },
  UiTooltip: { template: '<div class="ui-tooltip-stub"><slot /></div>' },
  VoucherSelectModal: {
    template: '<div v-if="visible" class="voucher-select-modal-stub" />',
    props: ['visible'],
  },
}

describe('CheckoutVoucherSelector Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('menampilkan trigger button default ketika belum ada voucher dan belum ada diskon yang memenuhi syarat', async () => {
    const cart = useCartStore()
    expect(cart.appliedCoupon).toBeNull()

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Gunakan / Masukkan Voucher')
    expect(wrapper.text()).toContain('Pilih')
    expect(wrapper.find('.pi-ticket').exists()).toBe(true)
  })

  it('menampilkan kartu rekomendasi diskon terbaik ketika subtotal memenuhi syarat kupon', async () => {
    const cart = useCartStore()
    // Subtotal Rp 300.000: SHELF10 memenuhi syarat (min Rp 200.000, hemat 10% = Rp 30.000)
    cart.addItem({
      productId: 1,
      name: 'Meja Kerja Minimalis',
      price: 300000,
      priceCents: 30000000,
      stock: 10,
      quantity: 1,
      openCartDrawer: false,
    })

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Diskon Terbaik')
    expect(wrapper.text()).toContain('SHELF10')
    expect(wrapper.text()).toMatch(/Hemat\s+Rp.*?30\.000/)
    expect(wrapper.text()).toContain('Pakai')
  })

  it('dapat menerapkan diskon terbaik secara 1-klik melalui tombol Pakai', async () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Meja Kerja Minimalis',
      price: 300000,
      priceCents: 30000000,
      stock: 10,
      quantity: 1,
      openCartDrawer: false,
    })

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const applyButton = wrapper.findAll('button').find((b) => b.text().includes('Pakai'))
    expect(applyButton?.exists()).toBe(true)

    await applyButton?.trigger('click')
    await flushPromises()

    expect(cart.appliedCoupon).not.toBeNull()
    expect(cart.appliedCoupon?.code).toBe('SHELF10')
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Voucher Otomatis Diterapkan',
      }),
    )
  })

  it('menampilkan kartu voucher aktif dengan rincian potongan dan tombol Ubah serta Hapus', async () => {
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
      name: 'Meja Kerja Minimalis',
      price: 300000,
      priceCents: 30000000,
      stock: 10,
      quantity: 1,
      openCartDrawer: false,
    })
    cart.applyCoupon(sampleCoupon)

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('SHELF10')
    expect(wrapper.text()).toMatch(/-Rp.*?30\.000/)
    expect(wrapper.text()).toContain('Ubah')
    expect(wrapper.find('button[aria-label="Hapus voucher promo"]').exists()).toBe(true)
  })

  it('dapat melepas voucher promo melalui tombol Hapus dengan toast checkout yang tepat', async () => {
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
    cart.applyCoupon(sampleCoupon)

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const removeBtn = wrapper.find('button[aria-label="Hapus voucher promo"]')
    await removeBtn.trigger('click')

    expect(cart.appliedCoupon).toBeNull()
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        summary: 'Voucher Dihapus',
        detail: 'Voucher promo telah dilepas dari pesanan checkout.',
      }),
    )
  })

  it('menampilkan peringatan jika subtotal belanja turun di bawah syarat minimum pembelian', async () => {
    const cart = useCartStore()
    const sampleCoupon: AppliedCoupon = {
      code: 'MIN500K',
      name: 'Diskon Khusus Min 500k',
      discount_type: 'fixed',
      discount_value: 5000000,
      max_discount_cents: null,
      min_purchase_cents: 50000000, // Rp 500.000
      discount_cents: 0,
      formatted_discount: 'Rp 0',
    }
    cart.addItem({
      productId: 1,
      name: 'Produk A',
      price: 200000,
      priceCents: 20000000, // Rp 200.000 (kurang Rp 300.000)
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })
    cart.applyCoupon(sampleCoupon)

    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Tambah belanjaan hingga')
    expect(wrapper.text()).toContain('Rp')
    expect(wrapper.text()).toContain('300.000')
  })

  it('membuka modal pemilih voucher saat tombol Ubah atau Pilih diklik', async () => {
    const cart = useCartStore()
    const wrapper = mount(CheckoutVoucherSelector, {
      props: { compact: false },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.find('.voucher-select-modal-stub').exists()).toBe(false)

    // Klik tombol trigger
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.voucher-select-modal-stub').exists()).toBe(true)
  })
})
