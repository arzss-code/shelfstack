import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KatalogToolbar from '~/components/katalog/KatalogToolbar.vue'
import CartSummarySidebar from '~/components/cart/CartSummarySidebar.vue'
import CheckoutOrderSummary from '~/components/checkout/CheckoutOrderSummary.vue'
import CheckoutAddressForm from '~/components/checkout/CheckoutAddressForm.vue'
import ShippingMethodSelector from '~/components/checkout/ShippingMethodSelector.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiBadge from '~/components/ui/UiBadge.vue'

vi.mock('~/features/cart/stores/cart', () => ({
  useCartStore: () => ({
    totalItems: 3,
    formattedTotalPrice: 'Rp 450.000',
    discountCents: 5000000,
    formattedDiscountAmount: 'Rp 50.000',
    formattedFinalPrice: 'Rp 400.000',
    appliedCoupon: { code: 'PROMOHEMAT' },
    removeCoupon: vi.fn(),
  }),
}))

describe('Storefront Primitives Unification (E-04)', () => {
  describe('KatalogToolbar.vue', () => {
    const defaultProps = {
      searchQuery: 'meja jati',
      selectedSort: 'featured',
      sortOptions: [
        { id: 'featured', label: 'Rekomendasi' },
        { id: 'price_asc', label: 'Harga Terendah' },
      ],
      gridDensity: 'compact' as const,
      activeFiltersCount: 2,
    }

    it('renders UiInput primitive with search configuration', () => {
      const wrapper = mount(KatalogToolbar, {
        props: defaultProps,
        global: {
          components: { UiInput, UiSelect, UiButton },
          stubs: { UiTooltip: true },
        },
      })

      const inputComponent = wrapper.findComponent(UiInput)
      expect(inputComponent.exists()).toBe(true)
      expect(inputComponent.props('modelValue')).toBe('meja jati')
      expect(inputComponent.props('size')).toBe('sm')
      expect(inputComponent.props('type')).toBe('search')
      expect(inputComponent.props('leftIcon')).toBe('pi-search')
    })

    it('renders UiSelect for catalog sorting', () => {
      const wrapper = mount(KatalogToolbar, {
        props: defaultProps,
        global: {
          components: { UiInput, UiSelect, UiButton },
          stubs: { UiTooltip: true },
        },
      })

      const selectComponent = wrapper.findComponent(UiSelect)
      expect(selectComponent.exists()).toBe(true)
      expect(selectComponent.props('modelValue')).toBe('featured')
      expect(selectComponent.props('prefix')).toBe('Urutkan:')
      expect(selectComponent.props('size')).toBe('sm')
      expect(selectComponent.props('pill')).toBe(true)
    })

    it('renders UiButton for mobile filter trigger with active filter count', () => {
      const wrapper = mount(KatalogToolbar, {
        props: defaultProps,
        global: {
          components: { UiInput, UiSelect, UiButton },
          stubs: { UiTooltip: true },
        },
      })

      const filterButton = wrapper.findComponent(UiButton)
      expect(filterButton.exists()).toBe(true)
      expect(filterButton.props('variant')).toBe('secondary')
      expect(filterButton.props('size')).toBe('sm')
      expect(filterButton.text()).toContain('Filter')
      expect(filterButton.text()).toContain('2')
    })
  })

  describe('CartSummarySidebar.vue', () => {
    it('wraps order summary with UiCard and renders UiBadge for items count', () => {
      const wrapper = mount(CartSummarySidebar, {
        global: {
          components: { UiCard, UiBadge, UiButton },
          stubs: { CartCouponInput: true },
        },
      })

      const card = wrapper.findComponent(UiCard)
      expect(card.exists()).toBe(true)

      const badge = wrapper.findComponent(UiBadge)
      expect(badge.exists()).toBe(true)
      expect(badge.props('label')).toBe('3 item')
      expect(badge.props('variant')).toBe('default')
    })
  })

  describe('CheckoutOrderSummary.vue', () => {
    const summaryProps = {
      items: [
        {
          productId: 1,
          name: 'Meja Kerja Minimalis',
          price: 450000,
          quantity: 2,
        },
      ],
      totalItems: 2,
      totalPrice: 'Rp 900.000',
      finalPrice: 'Rp 900.000',
    }

    it('embeds summary in UiCard with UiBadge counter and UiButton CTA', () => {
      const wrapper = mount(CheckoutOrderSummary, {
        props: summaryProps,
        global: {
          components: { UiCard, UiBadge, UiButton },
          stubs: { CheckoutVoucherSelector: true },
        },
      })

      const card = wrapper.findComponent(UiCard)
      expect(card.exists()).toBe(true)

      const badge = wrapper.findComponent(UiBadge)
      expect(badge.exists()).toBe(true)
      expect(badge.props('label')).toBe('2 barang')

      const submitBtn = wrapper.findComponent(UiButton)
      expect(submitBtn.exists()).toBe(true)
      expect(submitBtn.props('variant')).toBe('primary')
    })
  })

  describe('CheckoutAddressForm.vue', () => {
    const addressProps = {
      modelValue: {
        name: 'Atsiila Arya',
        phone: '081234567890',
        street: 'Jl. Sudirman No. 42',
        city: 'Kota Jakarta Selatan, DKI Jakarta',
        postal: '12110',
        note: 'Dekat resepsionis',
      },
    }

    it('wraps delivery form inside UiCard container', () => {
      const wrapper = mount(CheckoutAddressForm, {
        props: addressProps,
        global: {
          components: { UiCard, UiInput, UiButton },
          stubs: {
            LocationPickerModal: true,
            AddressPickerModal: true,
            CheckoutSelectedAddressCard: true,
          },
        },
      })

      const card = wrapper.findComponent(UiCard)
      expect(card.exists()).toBe(true)
      expect(wrapper.find('h2#shipping-heading').text()).toBe('Alamat Pengiriman')
    })

    it('uses UiInput for customer name, phone, street, and note', () => {
      const wrapper = mount(CheckoutAddressForm, {
        props: addressProps,
        global: {
          components: { UiCard, UiInput, UiButton },
          stubs: {
            LocationPickerModal: true,
            AddressPickerModal: true,
            CheckoutSelectedAddressCard: true,
          },
        },
      })

      const inputs = wrapper.findAllComponents(UiInput)
      expect(inputs.length).toBeGreaterThanOrEqual(4)

      const values = inputs.map((i) => i.props('modelValue'))
      expect(values).toContain('Atsiila Arya')
      expect(values).toContain('081234567890')
      expect(values).toContain('Jl. Sudirman No. 42')
      expect(values).toContain('Dekat resepsionis')
    })
  })

  describe('ShippingMethodSelector.vue', () => {
    it('wraps logistics method in UiCard container', () => {
      const wrapper = mount(ShippingMethodSelector, {
        props: {
          modelValue: 'reguler' as const,
          subtotalCents: 5000000,
        },
        global: {
          components: { UiCard },
        },
      })

      const card = wrapper.findComponent(UiCard)
      expect(card.exists()).toBe(true)
      expect(wrapper.text()).toContain('Metode Pengiriman')
      expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    })
  })
})
