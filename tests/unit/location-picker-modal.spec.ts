import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

describe('LocationPickerModal Component (SHF-LOC-01)', () => {
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

  it('renders modal header, search input, and popular chips when modelValue is true', () => {
    const wrapper = mountComponent({ modelValue: true })

    expect(wrapper.text()).toContain('Pilih Kota atau Kabupaten')
    expect(wrapper.text()).toContain('38 Provinsi & 514 Kota/Kabupaten')
    expect(wrapper.find('[data-testid="location-search-input"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Jakarta Selatan')
    expect(wrapper.text()).toContain('Bandung')
  })

  it('searches cities dynamically and displays results', async () => {
    const wrapper = mountComponent({ modelValue: true })

    const input = wrapper.find('[data-testid="location-search-input"]')
    await input.setValue('Bandung')

    expect(wrapper.text()).toContain('Kota Bandung')
    expect(wrapper.text()).toContain('Jawa Barat')
  })

  it('emits select event with structured location data when city is chosen', async () => {
    const wrapper = mountComponent({ modelValue: true })

    const input = wrapper.find('[data-testid="location-search-input"]')
    await input.setValue('Bandung')

    const bandungResult = wrapper.find('[data-testid="city-result-3273"]')
    expect(bandungResult.exists()).toBe(true)
    await bandungResult.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const emittedData = wrapper.emitted('select')?.[0]?.[0] as any
    expect(emittedData.cityName).toBe('Kota Bandung')
    expect(emittedData.provinceName).toBe('Jawa Barat')
    expect(emittedData.postalCode).toBe('40115')

    // Also emits update:modelValue to close modal
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('emits update:modelValue false when close button is clicked', async () => {
    const wrapper = mountComponent({ modelValue: true })

    const closeBtn = wrapper.find('[data-testid="close-location-modal"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('allows switching to cascading tabs and browsing provinces', async () => {
    const wrapper = mountComponent({ modelValue: true })

    // Click tab Pilihan Bertingkat
    const buttons = wrapper.findAll('button')
    const cascadingTabBtn = buttons.find((b) => b.text().includes('Pilihan Bertingkat'))
    expect(cascadingTabBtn).toBeDefined()
    await cascadingTabBtn!.trigger('click')

    expect(wrapper.text()).toContain('DKI Jakarta')
    expect(wrapper.text()).toContain('Jawa Barat')
    expect(wrapper.text()).toContain('Bali')

    // Click DKI Jakarta
    const updatedButtons = wrapper.findAll('button')
    const dkiBtn = updatedButtons.find((b) => b.text().includes('DKI Jakarta'))
    expect(dkiBtn).toBeDefined()
    await dkiBtn!.trigger('click')

    // Shows cities in DKI
    expect(wrapper.text()).toContain('Kota Jakarta Pusat')
    expect(wrapper.text()).toContain('Kota Jakarta Selatan')
    expect(wrapper.text()).toContain('Kembali ke Daftar Provinsi')
  })
})
