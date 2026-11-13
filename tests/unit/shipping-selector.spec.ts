import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShippingMethodSelector from '~/components/checkout/ShippingMethodSelector.vue'

describe('ShippingMethodSelector Component', () => {
  const globalStubs = {
    UiBadge: {
      template: '<span class="ui-badge" :data-variant="variant">{{ label }}</span>',
      props: ['label', 'variant'],
    },
  }

  it('renders all four shipping services with proper descriptions and estimates', () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 20000000, // Rp 200.000 (belum gratis ongkir)
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Metode Pengiriman')
    expect(wrapper.text()).toContain('Reguler')
    expect(wrapper.text()).toContain('Kilat / Next Day')
    expect(wrapper.text()).toContain('Instan / Sameday')
    expect(wrapper.text()).toContain('Kargo Ekonomis')

    expect(wrapper.text()).toContain('2-3 Hari Kerja')
    expect(wrapper.text()).toContain('1 Hari Kerja')
    expect(wrapper.text()).toContain('Tiba Hari Ini')
    expect(wrapper.text()).toContain('4-7 Hari Kerja')

    // Dynamic ETA badges
    const etaBadges = wrapper.findAll('[data-testid="dynamic-eta-badge"]')
    expect(etaBadges.length).toBe(4)
    expect(etaBadges[0]?.text()).toContain('Tiba')
  })

  it('emits update:modelValue when a shipping option is selected', async () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 20000000,
      },
      global: {
        stubs: globalStubs,
      },
    })

    const expressOption = wrapper.find('[data-testid="shipping-option-express"]')
    expect(expressOption.exists()).toBe(true)
    await expressOption.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['express'])

    const cargoOption = wrapper.find('[data-testid="shipping-option-cargo"]')
    await cargoOption.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['cargo'])
  })

  it('displays standard shipping fee when subtotal is below Rp 500.000', () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 49999900, // Rp 499.999
      },
      global: {
        stubs: globalStubs,
      },
    })

    const regulerOption = wrapper.find('[data-testid="shipping-option-reguler"]')
    expect(regulerOption.text()).toContain('15.000')
    expect(regulerOption.text()).not.toContain('Bebas Ongkir')
  })

  it('displays Bebas Ongkir badge for reguler service when subtotal is at or above Rp 500.000', () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 50000000, // Rp 500.000
      },
      global: {
        stubs: globalStubs,
      },
    })

    const regulerOption = wrapper.find('[data-testid="shipping-option-reguler"]')
    expect(regulerOption.text()).toContain('Bebas Ongkir')

    // Layanan kilat dan instan tetap berbayar meskipun subtotal >= Rp 500.000
    const expressOption = wrapper.find('[data-testid="shipping-option-express"]')
    expect(expressOption.text()).toContain('30.000')

    const instantOption = wrapper.find('[data-testid="shipping-option-instant"]')
    expect(instantOption.text()).toContain('45.000')
  })

  it('renders courier preference pills and emits update:selectedCourier', async () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        selectedCourier: null,
        subtotalCents: 20000000,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Preferensi Mitra Kurir')
    expect(wrapper.text()).toContain('Rekomendasi ShelfStack (Otomatis)')

    // Pilih kurir JNE
    const jneChip = wrapper.find('[data-testid="courier-chip-jne"]')
    expect(jneChip.exists()).toBe(true)
    await jneChip.trigger('click')

    expect(wrapper.emitted('update:selectedCourier')).toBeTruthy()
    expect(wrapper.emitted('update:selectedCourier')?.[0]).toEqual(['jne'])

    // Pilih kembali otomatis / rekomendasi (null)
    const autoChip = wrapper.find('[data-testid="courier-chip-auto"]')
    await autoChip.trigger('click')
    expect(wrapper.emitted('update:selectedCourier')?.[1]).toEqual([null])
  })

  it('supports keyboard navigation via arrow keys and enter', async () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 20000000,
      },
      global: {
        stubs: globalStubs,
      },
    })

    const regulerOption = wrapper.find('[data-testid="shipping-option-reguler"]')

    // ArrowDown navigates to express
    await regulerOption.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['express'])

    // Enter selects active option
    await regulerOption.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['reguler'])
  })

  it('does not emit updates when component is disabled', async () => {
    const wrapper = mount(ShippingMethodSelector, {
      props: {
        modelValue: 'reguler',
        subtotalCents: 20000000,
        disabled: true,
      },
      global: {
        stubs: globalStubs,
      },
    })

    const expressOption = wrapper.find('[data-testid="shipping-option-express"]')
    await expressOption.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    const jneChip = wrapper.find('[data-testid="courier-chip-jne"]')
    await jneChip.trigger('click')
    expect(wrapper.emitted('update:selectedCourier')).toBeFalsy()
  })
})
