import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiPagination from '../../app/components/ui/UiPagination.vue'

describe('UiPagination Component', () => {
  it('renders all page numbers when totalPages <= 7', () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 2,
        totalPages: 5,
        totalCount: 50,
        pageSize: 10,
        itemName: 'produk',
      },
    })

    // 5 tombol halaman
    for (let i = 1; i <= 5; i++) {
      expect(wrapper.find(`[data-testid="pagination-page-${i}"]`).exists()).toBe(true)
    }

    // Tidak ada ellipsis
    expect(wrapper.find('[data-testid="pagination-ellipsis"]').exists()).toBe(false)

    // Ringkasan rentang
    expect(wrapper.text()).toContain('Menampilkan 11 - 20 dari 50 produk')

    // Halaman aktif
    const activeBtn = wrapper.find('[data-testid="pagination-page-2"]')
    expect(activeBtn.attributes('aria-current')).toBe('page')
  })

  it('renders right ellipsis when near the beginning of large page count', () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 2,
        totalPages: 10,
        totalCount: 120,
        pageSize: 12,
      },
    })

    // Halaman 1, 2, 3, dan halaman 10 harus ada
    expect(wrapper.find('[data-testid="pagination-page-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-page-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-page-10"]').exists()).toBe(true)

    // Ellipsis harus ada
    expect(wrapper.find('[data-testid="pagination-ellipsis"]').exists()).toBe(true)
  })

  it('renders both left and right ellipsis when in the middle of large page count', () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 5,
        totalPages: 10,
        totalCount: 120,
        pageSize: 12,
      },
    })

    expect(wrapper.find('[data-testid="pagination-page-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-page-5"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-page-10"]').exists()).toBe(true)

    const ellipses = wrapper.findAll('[data-testid="pagination-ellipsis"]')
    expect(ellipses.length).toBeGreaterThanOrEqual(2)
  })

  it('disables previous button on first page and next button on last page', () => {
    const wrapperPage1 = mount(UiPagination, {
      props: {
        modelValue: 1,
        totalPages: 3,
      },
    })

    const prevBtn = wrapperPage1.find('[data-testid="pagination-prev"]')
    const nextBtn = wrapperPage1.find('[data-testid="pagination-next"]')
    expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
    expect((nextBtn.element as HTMLButtonElement).disabled).toBe(false)

    const wrapperPage3 = mount(UiPagination, {
      props: {
        modelValue: 3,
        totalPages: 3,
      },
    })

    expect(
      (wrapperPage3.find('[data-testid="pagination-prev"]').element as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (wrapperPage3.find('[data-testid="pagination-next"]').element as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('emits update:modelValue and change when clicking a page number or navigation button', async () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 1,
        totalPages: 5,
      },
    })

    // Klik halaman 3
    await wrapper.find('[data-testid="pagination-page-3"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    expect(wrapper.emitted('change')?.[0]).toEqual([3])

    // Klik tombol Selanjutnya
    await wrapper.find('[data-testid="pagination-next"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([2])
    expect(wrapper.emitted('change')?.[1]).toEqual([2])
  })

  it('renders fallback page text when totalCount is null', () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 2,
        totalPages: 4,
      },
    })

    expect(wrapper.text()).toContain('Halaman 2 dari 4')
  })

  it('disables buttons and sets aria-busy when loading is true', () => {
    const wrapper = mount(UiPagination, {
      props: {
        modelValue: 2,
        totalPages: 5,
        loading: true,
      },
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(
      (wrapper.find('[data-testid="pagination-prev"]').element as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (wrapper.find('[data-testid="pagination-next"]').element as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
