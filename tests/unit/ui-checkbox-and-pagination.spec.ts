import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import { useClientPagination } from '~/composables/useClientPagination'

describe('UiCheckbox vertical alignment & toggle', () => {
  it('merender label dan kotak sejajar tengah secara vertikal dan memancarkan toggle', async () => {
    const wrapper = mount(UiCheckbox, {
      props: {
        modelValue: true,
        label: 'Aktifkan voucher ini langsung setelah disimpan',
      },
    })

    const labelEl = wrapper.find('label')
    expect(labelEl.classes()).toContain('items-center')
    expect(wrapper.find('span.font-medium').classes()).toContain('leading-[18px]')

    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await input.setValue(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})

describe('useClientPagination & UiPagination compact', () => {
  it('memaginasi baris klien dan menurunkan halaman otomatis saat data tersaring', async () => {
    const rows = ref(Array.from({ length: 28 }, (_, i) => ({ id: i + 1 })))
    const { page, pageSize, totalCount, totalPages, paginatedItems, resetPage } =
      useClientPagination(rows, 12)

    expect(pageSize).toBe(12)
    expect(totalCount.value).toBe(28)
    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

    page.value = 3
    expect(paginatedItems.value.map((r) => r.id)).toEqual([25, 26, 27, 28])

    rows.value = rows.value.slice(0, 5)
    await nextTick()
    expect(totalPages.value).toBe(1)
    expect(page.value).toBe(1)
    expect(paginatedItems.value.map((r) => r.id)).toEqual([1, 2, 3, 4, 5])

    rows.value = Array.from({ length: 28 }, (_, i) => ({ id: i + 1 }))
    await nextTick()
    page.value = 2
    resetPage()
    expect(page.value).toBe(1)
  })

  it('merender info jumlah, navigasi angka, Sebelumnya, dan Selanjutnya di mode compact', async () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 1,
        totalPages: 4,
        totalCount: 42,
        pageSize: 12,
        itemName: 'produk',
        compact: true,
      },
    })

    expect(wrapper.text()).toContain('Menampilkan 1 - 12 dari 42 produk')
    expect(wrapper.find('[data-testid="pagination-prev"]').text()).toContain('Sebelumnya')
    expect(wrapper.find('[data-testid="pagination-next"]').text()).toContain('Selanjutnya')
    expect(wrapper.find('[data-testid="pagination-page-2"]').exists()).toBe(true)

    await wrapper.find('[data-testid="pagination-page-2"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    expect(wrapper.emitted('change')).toEqual([[2]])
  })
})
