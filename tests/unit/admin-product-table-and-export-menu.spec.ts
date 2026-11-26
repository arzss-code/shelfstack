import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminProductTable from '~/components/admin/products/AdminProductTable.vue'
import AdminOrderExportMenu from '~/features/orders/components/AdminOrderExportMenu.vue'
import type { Product } from '~/types/product'

const globalStubs = {
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  UiBadge: {
    props: ['label', 'variant'],
    template: '<span :data-variant="variant">{{ label }}</span>',
  },
  UiButton: {
    props: ['icon', 'variant', 'size', 'loading'],
    template: '<button type="button" @click="$emit(\'click\', $event)"><slot /></button>',
  },
  UiIconButton: {
    props: ['icon', 'label', 'variant', 'size'],
    template:
      '<button type="button" :aria-label="label" @click="$emit(\'click\', $event)">{{ label }}</button>',
  },
  UiTooltip: { template: '<div><slot /></div>' },
  UiSkeleton: { template: '<div class="skeleton" />' },
  UiEmptyState: {
    props: ['title', 'description', 'actionLabel'],
    template:
      '<div><p>{{ title }}</p><p>{{ description }}</p><button v-if="actionLabel" type="button" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
  },
}

describe('Admin UI Consistency Components', () => {
  it('renders AdminPageHeader with breadcrumbs, title, subtitle, and slots', () => {
    const wrapper = mount(AdminPageHeader, {
      props: {
        title: 'Kelola Produk',
        subtitle: 'Ringkasan manajemen katalog.',
        breadcrumbs: [{ label: 'Dashboard', to: '/admin' }, { label: 'Kelola Produk' }],
      },
      slots: {
        actions: '<button type="button">Tambah Produk</button>',
      },
      global: { stubs: { NuxtLink: globalStubs.NuxtLink } },
    })

    expect(wrapper.find('h1').text()).toBe('Kelola Produk')
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Ringkasan manajemen katalog.')
    expect(wrapper.text()).toContain('Tambah Produk')
  })

  it('renders AdminProductTable rows and emits management events', async () => {
    const sampleProducts: Product[] = [
      {
        id: 11,
        name: 'Kopi Grinder Burr Steel',
        price: 750000,
        stock: 3,
        image_url: 'https://example.com/grinder.jpg',
        category_id: 'kopi-seduh',
        slug: 'kopi-grinder',
        sold_count: 14,
        rating: 4.9,
      },
      {
        id: 12,
        name: 'Timbangan Kopi Digital',
        price: 320000,
        stock: 0,
        image_url: null,
      },
    ]

    const wrapper = mount(AdminProductTable, {
      props: { products: sampleProducts, loading: false },
      global: { stubs: globalStubs },
    })

    const rows = wrapper.findAll('[data-testid="admin-product-table-row"]')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.text()).toContain('Kopi Grinder Burr Steel')
    expect(rows[0]?.text()).toContain('Stok: 3')
    expect(rows[0]?.text()).toContain('14 terjual')
    expect(rows[1]?.text()).toContain('Habis')

    await rows[0]!.get('button[aria-label="Ubah Produk"]').trigger('click')
    expect(wrapper.emitted('edit')?.[0]).toEqual([sampleProducts[0]])

    await rows[0]!.get('button[aria-label="Hapus Produk"]').trigger('click')
    expect(wrapper.emitted('delete')?.[0]).toEqual([11])
  })

  it('supports restore action in AdminProductTable trash mode and search empty state', async () => {
    const trashItem: Product = {
      id: 99,
      name: 'Produk Arsip',
      price: 100000,
      stock: 5,
      image_url: null,
    }

    const wrapper = mount(AdminProductTable, {
      props: { products: [trashItem], loading: false, isTrash: true },
      global: { stubs: globalStubs },
    })

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('restore')?.[0]).toEqual([99])

    const emptyWrapper = mount(AdminProductTable, {
      props: { products: [], loading: false, isSearching: true },
      global: { stubs: globalStubs },
    })
    expect(emptyWrapper.text()).toContain('Tidak ada produk ditemukan')
    await emptyWrapper.get('button').trigger('click')
    expect(emptyWrapper.emitted('resetFilters')).toBeTruthy()
  })

  it('opens AdminOrderExportMenu on click, closes on Escape, and emits xlsx/csv selection', async () => {
    const wrapper = mount(AdminOrderExportMenu)
    const trigger = wrapper.get('[data-testid="admin-orders-export-trigger"]')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    await wrapper.get('[data-testid="export-format-xlsx"]').trigger('click')
    expect(wrapper.emitted('export')?.[0]).toEqual(['xlsx'])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await trigger.trigger('click')
    await wrapper.get('[data-testid="export-format-csv"]').trigger('click')
    expect(wrapper.emitted('export')?.[1]).toEqual(['csv'])

    await trigger.trigger('click')
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
