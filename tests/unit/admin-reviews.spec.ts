import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  adminReviewQuerySchema,
  adminReviewUpdateSchema,
  type AdminReviewItem,
} from '../../shared/schemas/review'
import AdminReviewsMetricCards from '../../app/components/admin/reviews/AdminReviewsMetricCards.vue'
import AdminReviewsFilterBar from '../../app/components/admin/reviews/AdminReviewsFilterBar.vue'
import AdminReviewsTable from '../../app/components/admin/reviews/AdminReviewsTable.vue'

describe('Admin Reviews Suite (Moderasi Ulasan Produk)', () => {
  const mockMetrics = {
    total: 25,
    active: 22,
    hidden: 3,
    fiveStar: 18,
    attention: 2,
    averageRating: 4.85,
  }

  const mockReviews: AdminReviewItem[] = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      product_id: 101,
      user_id: 'user-uuid-1',
      order_id: 'order-uuid-1',
      order_item_id: null,
      rating: 5,
      review_text: 'Kualitas kayu solid sangat kokoh dan pengerjaannya sangat halus.',
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T10:00:00Z',
      deleted_at: null,
      product_name: 'Meja Kerja Minimalis Oak',
      product_image_url: 'https://example.com/meja.jpg',
      reviewer_name: 'Budi S.',
      reviewer_email: 'budi@example.com',
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      product_id: 102,
      user_id: 'user-uuid-2',
      order_id: 'order-uuid-2',
      order_item_id: null,
      rating: 2,
      review_text: 'Pengiriman agak terlambat dan kardus sedikit penyok saat diterima.',
      created_at: '2026-11-19T14:30:00Z',
      updated_at: '2026-11-19T14:30:00Z',
      deleted_at: '2026-11-19T16:00:00Z',
      product_name: 'Lampu Meja LED',
      product_image_url: null,
      reviewer_name: 'Siti R.',
      reviewer_email: 'siti@example.com',
    },
  ]

  describe('Zod Validation Schemas', () => {
    it('validates adminReviewQuerySchema with defaults and filters', () => {
      const parsedDefault = adminReviewQuerySchema.parse({})
      expect(parsedDefault.page).toBe(1)
      expect(parsedDefault.limit).toBe(20)
      expect(parsedDefault.status).toBe('all')
      expect(parsedDefault.q).toBe('')

      const parsedFiltered = adminReviewQuerySchema.parse({
        page: '2',
        limit: '15',
        rating: '5',
        status: 'hidden',
        q: 'kokoh',
      })
      expect(parsedFiltered.page).toBe(2)
      expect(parsedFiltered.limit).toBe(15)
      expect(parsedFiltered.rating).toBe(5)
      expect(parsedFiltered.status).toBe('hidden')
      expect(parsedFiltered.q).toBe('kokoh')
    })

    it('validates adminReviewUpdateSchema payload', () => {
      const validHide = adminReviewUpdateSchema.safeParse({ is_hidden: true })
      expect(validHide.success).toBe(true)

      const validRestore = adminReviewUpdateSchema.safeParse({ is_hidden: false })
      expect(validRestore.success).toBe(true)

      const invalid = adminReviewUpdateSchema.safeParse({ is_hidden: 'invalid' })
      expect(invalid.success).toBe(false)
    })
  })

  describe('AdminReviewsMetricCards Component', () => {
    it('renders all 4 review KPI metrics accurately', () => {
      const wrapper = mount(AdminReviewsMetricCards, {
        props: {
          metrics: mockMetrics,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('Total Ulasan')
      expect(wrapper.text()).toContain('25')
      expect(wrapper.text()).toContain('22 aktif, 3 disembunyikan')

      expect(wrapper.text()).toContain('Rata-rata Rating')
      expect(wrapper.text()).toContain('4.85 / 5.0')

      expect(wrapper.text()).toContain('Bintang 5 Sempurna')
      expect(wrapper.text()).toContain('18')

      expect(wrapper.text()).toContain('Perlu Perhatian (Bintang ≤ 3)')
      expect(wrapper.text()).toContain('2')
    })
  })

  describe('AdminReviewsFilterBar Component', () => {
    it('renders filter tabs and handles status / rating changes', async () => {
      const wrapper = mount(AdminReviewsFilterBar, {
        props: {
          metrics: mockMetrics,
          activeStatus: 'all',
          activeRating: undefined,
          searchQuery: '',
        },
      })

      expect(wrapper.text()).toContain('Semua')
      expect(wrapper.text()).toContain('Aktif di Etalase')
      expect(wrapper.text()).toContain('Disembunyikan')

      const buttons = wrapper.findAll('button')
      const activeBtn = buttons.find((b) => b.text().includes('Aktif di Etalase'))
      expect(activeBtn).toBeDefined()
      await activeBtn?.trigger('click')

      expect(wrapper.emitted('update:status')?.[0]).toEqual(['active'])
    })
  })

  describe('AdminReviewsTable Component', () => {
    const globalStubs = {
      NuxtLink: {
        template: '<a :href="to"><slot /></a>',
        props: ['to'],
      },
    }

    it('renders review rows, product details, ratings, and status badges', () => {
      const wrapper = mount(AdminReviewsTable, {
        props: {
          reviews: mockReviews,
          loading: false,
          mutatingId: null,
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 2,
            totalPages: 1,
          },
        },
        global: { stubs: globalStubs },
      })

      const rows = wrapper.findAll('[data-testid="admin-review-row"]')
      expect(rows).toHaveLength(2)

      // Row 1: Active
      expect(rows[0].text()).toContain('Meja Kerja Minimalis Oak')
      expect(rows[0].text()).toContain('Budi S.')
      expect(rows[0].text()).toContain('budi@example.com')
      expect(rows[0].text()).toContain('5')
      expect(rows[0].text()).toContain('Kualitas kayu solid sangat kokoh')
      expect(rows[0].text()).toContain('Aktif')
      expect(rows[0].text()).toContain('Sembunyikan')

      // Row 2: Hidden
      expect(rows[1].text()).toContain('Lampu Meja LED')
      expect(rows[1].text()).toContain('Siti R.')
      expect(rows[1].text()).toContain('Disembunyikan')
      expect(rows[1].text()).toContain('Pulihkan')
    })

    it('emits toggleStatus event when moderation button is clicked', async () => {
      const wrapper = mount(AdminReviewsTable, {
        props: {
          reviews: mockReviews,
          loading: false,
          mutatingId: null,
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 2,
            totalPages: 1,
          },
        },
        global: { stubs: globalStubs },
      })

      const rows = wrapper.findAll('[data-testid="admin-review-row"]')
      const hideBtn = rows[0].find('button')
      await hideBtn.trigger('click')

      expect(wrapper.emitted('toggleStatus')).toBeTruthy()
      expect(wrapper.emitted('toggleStatus')?.[0]).toEqual([mockReviews[0]])
    })

    it('renders clean empty state when reviews list is empty', () => {
      const wrapper = mount(AdminReviewsTable, {
        props: {
          reviews: [],
          loading: false,
          mutatingId: null,
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 1,
          },
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Tidak Ada Ulasan Ditemukan')
      expect(wrapper.findAll('[data-testid="admin-review-row"]')).toHaveLength(0)
    })
  })
})
