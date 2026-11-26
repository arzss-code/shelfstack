import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import h3PatchHandler from '~~/server/middleware/01.h3-patch'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'
import UiDateRangePicker from '~/components/ui/UiDateRangePicker.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import { useClientPagination } from '~/composables/useClientPagination'
import { getPresetDateRange } from '~/composables/useCalendarGrid'

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
  it('memaginasi baris klien, mengubah jumlah baris, dan menurunkan halaman otomatis saat data tersaring', async () => {
    const rows = ref(Array.from({ length: 28 }, (_, i) => ({ id: i + 1 })))
    const { page, pageSize, totalCount, totalPages, paginatedItems, resetPage, setPageSize } =
      useClientPagination(rows, 12)

    expect(pageSize.value).toBe(12)
    expect(totalCount.value).toBe(28)
    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

    page.value = 3
    expect(paginatedItems.value.map((r) => r.id)).toEqual([25, 26, 27, 28])

    setPageSize(25)
    await nextTick()
    expect(page.value).toBe(1)
    expect(totalPages.value).toBe(2)

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

  it('merender info jumlah, dropdown Tampilkan, navigasi angka, Sebelumnya, dan Selanjutnya di mode compact', async () => {
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
    expect(wrapper.text()).toContain('Tampilkan')
    expect(wrapper.find('[data-testid="pagination-prev"]').text()).toContain('Sebelumnya')
    expect(wrapper.find('[data-testid="pagination-next"]').text()).toContain('Selanjutnya')
    expect(wrapper.find('[data-testid="pagination-page-2"]').exists()).toBe(true)

    await wrapper.find('[data-testid="pagination-page-2"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    expect(wrapper.emitted('change')).toEqual([[2]])

    await wrapper.find('select').setValue('25')
    expect(wrapper.emitted('update:pageSize')).toEqual([[25]])
    expect(wrapper.emitted('pageSizeChange')).toEqual([[25]])
  })
})

describe('UiDateRangePicker & 01.h3-patch non-enumerable headers.get', () => {
  it('membuka kalender kustom, memilih preset, dan membersihkan rentang tanggal', async () => {
    const fixedNow = new Date(2026, 10, 26)
    expect(getPresetDateRange('last7', fixedNow)).toEqual({
      from: '2026-11-20',
      to: '2026-11-26',
    })

    const wrapper = mount(UiDateRangePicker, {
      props: { from: '2026-11-01', to: '2026-11-22' },
    })

    const trigger = wrapper.find('[data-testid="date-range-trigger"]')
    expect(trigger.text()).toContain('1 Nov - 22 Nov 2026')
    await trigger.trigger('click')
    expect(wrapper.find('[data-testid="date-range-popover"]').exists()).toBe(true)

    await wrapper.find('[data-testid="date-range-clear"]').trigger('click')
    expect(wrapper.emitted('update:from')?.[0]).toEqual([''])
    expect(wrapper.emitted('update:to')?.[0]).toEqual([''])
  })

  it('menjaga properti headers.get non-enumerable agar event.headers tidak gagal Headers.set', () => {
    const socket = new Socket()
    const req = new IncomingMessage(socket)
    req.headers = { host: 'localhost:3000', 'x-test': 'ok' }
    const res = new ServerResponse(req)
    const event = createEvent(req, res)

    h3PatchHandler(event)

    expect(typeof (req.headers as Record<string, unknown>).get).toBe('function')
    expect(Object.keys(req.headers)).toEqual(['host', 'x-test'])
    expect(() => event.headers).not.toThrow()
    expect(event.headers.get('x-test')).toBe('ok')
  })
})
