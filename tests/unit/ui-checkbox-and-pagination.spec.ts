import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createEvent, type H3Event } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import h3PatchHandler from '~~/server/middleware/01.h3-patch'
import { getDeviceInfo } from '~~/server/utils/device'
import {
  enrichRecentOrderActivityDevice,
  insertActivityLogWithDevice,
} from '~~/server/utils/activity-log'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'
import UiDateRangePicker from '~/components/ui/UiDateRangePicker.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
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

describe('useClientPagination & UiPagination compact centered', () => {
  it('memaginasi baris klien, mengubah jumlah baris, dan menurunkan halaman otomatis saat data tersaring', async () => {
    const rows = ref(Array.from({ length: 28 }, (_, i) => ({ id: i + 1 })))
    const { page, pageSize, totalCount, totalPages, paginatedItems, resetPage, setPageSize } =
      useClientPagination(rows, 10)

    expect(pageSize.value).toBe(10)
    expect(totalCount.value).toBe(28)
    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    page.value = 3
    expect(paginatedItems.value.map((r) => r.id)).toEqual([21, 22, 23, 24, 25, 26, 27, 28])

    setPageSize(5)
    await nextTick()
    expect(page.value).toBe(1)
    expect(totalPages.value).toBe(6)

    rows.value = rows.value.slice(0, 5)
    await nextTick()
    expect(totalPages.value).toBe(1)
    expect(page.value).toBe(1)

    rows.value = Array.from({ length: 28 }, (_, i) => ({ id: i + 1 }))
    await nextTick()
    page.value = 2
    resetPage()
    expect(page.value).toBe(1)
  })

  it('merender ringkasan kompak tanpa duplikasi, dropdown h-7 di tengah bernilai 5-50 data, dan navigasi halaman', async () => {
    const multiPage = mount(UiPagination, {
      props: {
        modelValue: 1,
        totalPages: 4,
        totalCount: 42,
        pageSize: 10,
        itemName: 'produk',
        compact: true,
      },
    })

    expect(multiPage.text()).toContain('1 - 10 / 42 produk')
    expect(multiPage.text()).toContain('Hal 1/4')
    expect(multiPage.text()).toContain('Tampilkan')
    expect(multiPage.find('[data-testid="pagination-page-size-wrap"]').classes()).toContain(
      'lg:order-2',
    )

    const selectTrigger = multiPage.find('button[aria-haspopup="listbox"]')
    expect(selectTrigger.classes()).toContain('h-7')
    expect(selectTrigger.classes()).toContain('rounded-full')
    expect(selectTrigger.text()).toContain('10 data')

    const optionValues = multiPage
      .findAll('select option')
      .map((o) => o.attributes('value'))
      .filter((v): v is string => Boolean(v))
    expect(optionValues).toEqual(['5', '10', '15', '25', '50'])

    await multiPage.find('[data-testid="pagination-page-2"]').trigger('click')
    expect(multiPage.emitted('update:modelValue')).toEqual([[2]])
    expect(multiPage.emitted('change')).toEqual([[2]])

    await multiPage.find('select').setValue('5')
    expect(multiPage.emitted('update:pageSize')).toEqual([[5]])
    expect(multiPage.emitted('pageSizeChange')).toEqual([[5]])

    const singlePage = mount(UiPagination, {
      props: {
        modelValue: 1,
        totalPages: 1,
        totalCount: 15,
        pageSize: 15,
        itemName: 'aktivitas',
        compact: true,
      },
    })
    expect(singlePage.text()).toContain('Total 15 aktivitas')
    expect(singlePage.text()).not.toContain('15 dari 15')
  })
})

describe('UiDateRangePicker (Month/Year selector), H3 headers.get, & Activity device logging', () => {
  it('membuka kalender kustom, mengganti bulan dan tahun langsung, dan membersihkan rentang tanggal', async () => {
    const fixedNow = new Date(2026, 10, 26)
    expect(getPresetDateRange('last7', fixedNow)).toEqual({
      from: '2026-11-20',
      to: '2026-11-26',
    })

    const wrapper = mount(UiDateRangePicker, {
      props: { from: '2026-11-01', to: '2026-11-22' },
    })

    await wrapper.find('[data-testid="date-range-trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="date-range-popover"]').exists()).toBe(true)

    await wrapper.find('[data-testid="date-range-month-btn"]').trigger('click')
    const monthGrid = wrapper.find('[data-testid="date-range-month-grid"]')
    expect(monthGrid.exists()).toBe(true)
    const janBtn = monthGrid.findAll('button').find((b) => b.text() === 'Jan')
    await janBtn?.trigger('click')
    expect(wrapper.find('[data-testid="date-range-month-btn"]').text()).toContain('Januari')

    await wrapper.find('[data-testid="date-range-year-btn"]').trigger('click')
    const yearGrid = wrapper.find('[data-testid="date-range-year-grid"]')
    expect(yearGrid.exists()).toBe(true)
    const yr2025Btn = yearGrid.findAll('button').find((b) => b.text() === '2025')
    await yr2025Btn?.trigger('click')
    expect(wrapper.find('[data-testid="date-range-year-btn"]').text()).toContain('2025')
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

    expect(typeof (event.node.req.headers as { get?: unknown }).get).toBe('function')
    expect(Object.keys(event.node.req.headers)).not.toContain('get')
    expect(() => event.headers.get('x-test')).not.toThrow()
    expect(event.headers.get('x-test')).toBe('ok')
  })

  it('menangkap Edge sebelum Chrome dan mengisi device metadata ke activity_logs dengan aman', async () => {
    const socket = new Socket()
    const req = new IncomingMessage(socket)
    req.headers = {
      'x-forwarded-for': '203.0.113.45, 10.0.0.1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    }
    const event = createEvent(req, new ServerResponse(req))

    expect(getDeviceInfo(event)).toEqual({
      ipAddress: '203.0.113.45',
      browser: 'Edge',
      platform: 'Windows',
    })

    const mockMinimalEvent = { context: { requestId: 'unit' } } as unknown as H3Event
    expect(getDeviceInfo(mockMinimalEvent)).toEqual({
      ipAddress: 'Tidak tercatat',
      browser: 'Tidak tercatat',
      platform: 'Tidak tercatat',
    })

    const insertFn = vi.fn().mockResolvedValue({ error: null })
    const updateEqFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn(() => ({ eq: updateEqFn }))
    const limitFn = vi.fn().mockResolvedValue({
      data: [{ id: 'log-1', ip_address: null, new_data: { order_id: 'ord-99' }, old_data: null }],
      error: null,
    })
    const fakeClient = {
      from: vi.fn(() => ({
        insert: insertFn,
        update: updateFn,
        select: () => ({
          in: () => ({
            gte: () => ({
              order: () => ({
                limit: limitFn,
              }),
            }),
          }),
        }),
      })),
    }

    await insertActivityLogWithDevice(fakeClient as never, event, {
      entity_type: 'return_request',
      entity_id: 0,
      action: 'UPDATE',
      description: 'Update tiket',
    })
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '203.0.113.45',
        browser: 'Edge',
        platform: 'Windows',
      }),
    )

    await enrichRecentOrderActivityDevice(event, 'ord-99', fakeClient as never)
    expect(updateFn).toHaveBeenCalledWith({
      ip_address: '203.0.113.45',
      browser: 'Edge',
      platform: 'Windows',
    })
    expect(updateEqFn).toHaveBeenCalledWith('id', 'log-1')
  })

  it('menjaga UiSelect bebas markup SSR Teleport ketika teleport=false', async () => {
    const app = createSSRApp({
      render: () =>
        h(UiSelect, {
          modelValue: 'featured',
          options: [{ value: 'featured', label: 'Pilihan Kurator' }],
          teleport: false,
        }),
    })
    const html = await renderToString(app)
    expect(html).not.toContain('teleport')
  })
})
