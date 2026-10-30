import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

describe('LocationPickerModal Component (Shopee-Style 4-Tier Cascade)', () => {
  const mountComponent = (props = {}) => {
    return mount(LocationPickerModal, {
      props: {
        modelValue: true,
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  it('does not render modal content when modelValue is false', () => {
    const wrapper = mountComponent({ modelValue: false })
    expect(wrapper.find('[data-testid="location-picker-modal"]').exists()).toBe(false)
  })

  it('renders modal header, search input, and 4 Shopee cascading tabs', () => {
    const wrapper = mountComponent({ modelValue: true })

    expect(wrapper.text()).toContain('Pilih Alamat Administratif')
    expect(wrapper.find('[data-testid="location-search-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-province"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-city"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-district"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-postal"]').exists()).toBe(true)
  })

  it('performs 4-tier cascading selection: Provinsi -> Kota -> Kecamatan -> Kode Pos', async () => {
    const wrapper = mountComponent({ modelValue: true })

    // Step 1: Click DKI JAKARTA in Provinsi tab
    const provBtn = wrapper.find('[data-testid="province-item-31"]')
    expect(provBtn.exists()).toBe(true)
    await provBtn.trigger('click')

    // Automatically advances to Kota tab
    expect(wrapper.find('[data-testid="tab-city"]').classes()).toContain('text-orange-600')
    const jakselBtn = wrapper.find('[data-testid="city-item-31.74"]')
    expect(jakselBtn.exists()).toBe(true)

    // Step 2: Click Kota Jakarta Selatan
    await jakselBtn.trigger('click')

    // Automatically advances to Kecamatan tab
    expect(wrapper.find('[data-testid="tab-district"]').classes()).toContain('text-orange-600')
    const tebetBtn = wrapper.find('[data-testid="district-item-31.74.01"]')
    expect(tebetBtn.exists()).toBe(true)

    // Step 3: Click Tebet
    await tebetBtn.trigger('click')

    // Automatically advances to Kode Pos tab
    expect(wrapper.find('[data-testid="tab-postal"]').classes()).toContain('text-orange-600')
    const postalBtn = wrapper.find('[data-testid="postal-item-12810"]')
    expect(postalBtn.exists()).toBe(true)

    // Step 4: Click Postal Code 12810
    await postalBtn.trigger('click')

    // Verifies emission of structured 4-tier location data
    expect(wrapper.emitted('select')).toBeTruthy()
    const emitted = wrapper.emitted('select')?.[0]?.[0] as any
    expect(emitted.provinceId).toBe('31')
    expect(emitted.provinceName).toBe('DKI Jakarta')
    expect(emitted.cityName).toBe('Kota Jakarta Selatan')
    expect(emitted.districtName).toBe('Tebet')
    expect(emitted.postalCode).toBe('12810')

    // Also emits update:modelValue to close modal
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('searches dynamically and selects result directly via autocomplete', async () => {
    const wrapper = mountComponent({ modelValue: true })

    const input = wrapper.find('[data-testid="location-search-input"]')
    await input.setValue('Tebet')

    const searchItems = wrapper.findAll('[data-testid="search-result-item"]')
    expect(searchItems.length).toBeGreaterThan(0)
    expect(searchItems[0]!.text()).toContain('Tebet')

    await searchItems[0]!.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const emitted = wrapper.emitted('select')?.[0]?.[0] as any
    expect(emitted.districtName).toBe('Tebet')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('emits update:modelValue false when close button is clicked', async () => {
    const wrapper = mountComponent({ modelValue: true })

    const closeBtn = wrapper.find('[data-testid="close-location-modal"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
