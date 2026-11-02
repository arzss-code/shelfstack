import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckoutAddressForm from '~/components/checkout/CheckoutAddressForm.vue'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

describe('CheckoutAddressForm', () => {
  const defaultAddress = {
    name: 'Atsiila Arya',
    phone: '081234567890',
    street: 'Jl. Sudirman No. 42',
    city: '',
    postal: '',
    note: 'Dekat lobby',
  }

  it('renders search location button when city is empty', () => {
    const wrapper = mount(CheckoutAddressForm, {
      props: {
        modelValue: { ...defaultAddress },
      },
      global: {
        stubs: {
          Teleport: true,
          SavedAddressSelector: true,
          UiInput: true,
        },
      },
    })

    const openBtn = wrapper.find('[data-testid="open-location-picker-btn"]')
    expect(openBtn.exists()).toBe(true)
    expect(openBtn.text()).toContain('Pilih Provinsi, Kota, Kecamatan & Kode Pos')
  })

  it('renders filled location card and Ubah button when city is populated', () => {
    const wrapper = mount(CheckoutAddressForm, {
      props: {
        modelValue: {
          ...defaultAddress,
          city: 'Kota Jakarta Selatan, DKI Jakarta',
          postal: '12110',
        },
      },
      global: {
        stubs: {
          Teleport: true,
          SavedAddressSelector: true,
          UiInput: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Kota Jakarta Selatan, DKI Jakarta')
    expect(wrapper.text()).toContain('12110')
    const changeBtn = wrapper.find('[data-testid="change-location-btn"]')
    expect(changeBtn.exists()).toBe(true)
  })

  it('updates form when LocationPickerModal emits select', async () => {
    const wrapper = mount(CheckoutAddressForm, {
      props: {
        modelValue: { ...defaultAddress },
      },
      global: {
        stubs: {
          Teleport: true,
          SavedAddressSelector: true,
          UiInput: true,
        },
      },
    })

    const modal = wrapper.findComponent(LocationPickerModal)
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('select', {
      provinceId: '31',
      provinceName: 'DKI Jakarta',
      cityId: '31.74',
      cityName: 'Kota Jakarta Selatan',
      districtId: '31.74.01',
      districtName: 'Tebet',
      postalCode: '12810',
      displayLabel: 'Tebet, Kota Jakarta Selatan, DKI Jakarta (12810)',
    })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]![0]).toEqual({
      ...defaultAddress,
      city: 'Kec. Tebet, Kota Jakarta Selatan, DKI Jakarta',
      postal: '12810',
    })
  })
})
