import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSelect from '~/components/ui/UiSelect.vue'

describe('UiSelect Component', () => {
  const sampleOptions = [
    { value: 'featured', label: 'Pilihan Kurator' },
    { value: 'popular', label: 'Paling Populer' },
    { value: 'price-asc', label: 'Harga: Rendah ke Tinggi' },
    { value: 'price-desc', label: 'Harga: Tinggi ke Rendah' },
    { value: 'out-of-stock', label: 'Stok Habis', disabled: true },
  ]

  it('merender tombol pemicu dengan label opsi yang terpilih', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
      },
    })

    const trigger = wrapper.find('button[role="combobox"], button[aria-haspopup="listbox"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toContain('Pilihan Kurator')
  })

  it('merender placeholder saat tidak ada nilai terpilih', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: '',
        options: sampleOptions,
        placeholder: 'Pilih urutan produk...',
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    expect(trigger.text()).toContain('Pilih urutan produk...')
  })

  it('merender teks prefix saat properti prefix disediakan', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'popular',
        options: sampleOptions,
        prefix: 'Urutkan:',
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    expect(trigger.text()).toContain('Urutkan:')
    expect(trigger.text()).toContain('Paling Populer')
  })

  it('membuka dan menutup popover listbox saat tombol pemicu diklik', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(trigger.attributes('aria-expanded')).toBe('false')

    // Klik untuk membuka
    await trigger.trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    expect(trigger.attributes('aria-expanded')).toBe('true')

    // Klik lagi untuk menutup
    await trigger.trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('memancarkan update:modelValue saat opsi diklik dan menutup dropdown', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    await trigger.trigger('click')

    const options = wrapper.findAll('[role="option"]')
    expect(options.length).toBe(5)

    // Klik opsi kedua: "Paling Populer"
    await options[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['popular'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['popular'])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('tidak memilih opsi yang berstatus disabled', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
      },
    })

    await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
    const disabledOption = wrapper.findAll('[role="option"]')[4]
    expect(disabledOption.text()).toContain('Stok Habis')

    await disabledOption.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('mendukung navigasi keyboard: ArrowDown, Enter, dan Escape', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')

    // ArrowDown saat tertutup membuka dropdown
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    // ArrowDown berikutnya memindahkan aktif ke item berikutnya
    await trigger.trigger('keydown', { key: 'ArrowDown' })

    // Enter memilih item aktif
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['popular'])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    // Buka kembali lalu Escape untuk menutup
    await trigger.trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    await trigger.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('tidak membuka dropdown bila properti disabled bernilai true', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'featured',
        options: sampleOptions,
        disabled: true,
      },
    })

    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    expect(trigger.attributes('disabled')).toBeDefined()

    await trigger.trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('menampilkan pesan error bila prop error disediakan', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: '',
        options: sampleOptions,
        error: 'Kategori wajib dipilih',
      },
    })

    expect(wrapper.text()).toContain('Kategori wajib dipilih')
    const trigger = wrapper.find('button[aria-haspopup="listbox"]')
    expect(trigger.attributes('aria-invalid')).toBe('true')
  })
})
