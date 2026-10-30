import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ReviewRatingSummary from '../../app/components/product/ReviewRatingSummary.vue'
import ReviewCard from '../../app/components/product/ReviewCard.vue'
import ReviewFormModal from '../../app/components/product/ReviewFormModal.vue'
import ReviewFilterBar from '../../app/components/product/ReviewFilterBar.vue'
import ProductReviewsSection from '../../app/components/product/ProductReviewsSection.vue'
import type {
  ProductReview,
  ProductReviewsSummary,
  ReviewEligibility,
} from '../../app/types/review'
import { formatReviewerName, formatReviewDate } from '../../app/utils/format'

const mockReviewsList: ProductReview[] = [
  {
    id: 'rev-1',
    product_id: 101,
    order_id: 'ord-101',
    user_name: 'Budi Santoso',
    rating: 5,
    review_text: 'Kualitas kayu solid sangat kokoh dan pengerjaan sangat rapi. Sangat puas!',
    created_at: '2026-10-28T10:00:00Z',
  },
  {
    id: 'rev-2',
    product_id: 101,
    order_id: 'ord-102',
    user_name: 'Atsiila Arya',
    rating: 4,
    review_text: 'Desain minimalis modern sangat cocok di ruang kerja. Perakitan relatif mudah.',
    created_at: '2026-10-25T14:30:00Z',
  },
  {
    id: 'rev-3',
    product_id: 101,
    order_id: 'ord-103',
    user_email: 'citra.lestari@example.com',
    rating: 5,
    review_text: 'Finishing matte halus sekali, hairline border rapi tanpa cela. Pengiriman aman.',
    created_at: '2026-10-20T08:15:00Z',
  },
]

const mockSummaryData: ProductReviewsSummary = {
  average_rating: 4.7,
  total_reviews: 3,
  distribution: {
    5: 2,
    4: 1,
    3: 0,
    2: 0,
    1: 0,
  },
}

const mockEligibilityData: ReviewEligibility = {
  eligible: true,
  order_id: 'ord-104',
}

const { mockFetch, toastShowMock, toastAddMock, mockUser } = vi.hoisted(() => {
  const tShow = vi.fn()
  const tAdd = vi.fn()
  const uMock = { value: { id: 'usr-123', email: 'user@example.com' } }
  const fMock: any = vi.fn()
  fMock.create = () => fMock
  fMock.raw = vi.fn()
  return {
    mockFetch: fMock,
    toastShowMock: tShow,
    toastAddMock: tAdd,
    mockUser: uMock,
  }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

mockNuxtImport('useUiToast', () => () => ({
  show: toastShowMock,
  add: toastAddMock,
  remove: vi.fn(),
  clear: vi.fn(),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)

mockNuxtImport('useUiConfirm', () => () => ({
  confirmState: { value: null },
  confirmBusy: { value: false },
  require: vi.fn(({ accept }) => accept()),
  accept: vi.fn(),
  close: vi.fn(),
}))

const globalStubs = {
  UiModal: {
    template: `
      <div v-if="visible" class="ui-modal-stub" data-testid="ui-modal">
        <div class="modal-header">{{ title }}</div>
        <div class="modal-body"><slot /></div>
      </div>
    `,
    props: ['visible', 'title', 'description', 'size'],
  },
  UiCard: {
    template: '<div class="ui-card-stub"><slot /></div>',
    props: ['padded', 'hoverable'],
  },
  UiButton: {
    template: `
      <button :type="type || 'button'" :disabled="disabled || loading" class="ui-button-stub" @click="$emit('click', $event)">
        <slot />
      </button>
    `,
    props: ['type', 'variant', 'size', 'loading', 'disabled', 'icon'],
  },
  UiTextarea: {
    template: `
      <div class="ui-textarea-stub">
        <label v-if="label">{{ label }}</label>
        <textarea
          :value="modelValue"
          :placeholder="placeholder"
          :rows="rows"
          :maxlength="maxlength"
          :disabled="disabled"
          @input="$emit('update:modelValue', $event.target.value)"
        />
        <span v-if="error" class="error-msg">{{ error }}</span>
      </div>
    `,
    props: ['modelValue', 'label', 'placeholder', 'rows', 'maxlength', 'error', 'disabled'],
    emits: ['update:modelValue'],
  },
  UiEmptyState: {
    template: `
      <div class="ui-empty-state-stub">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
        <button v-if="actionLabel" class="empty-action-btn" @click="$emit('action')">{{ actionLabel }}</button>
      </div>
    `,
    props: ['icon', 'title', 'description', 'actionLabel'],
    emits: ['action'],
  },
  UiSkeleton: {
    template: '<div class="ui-skeleton-stub" />',
    props: ['width', 'height', 'shape'],
  },
  UiSelect: {
    name: 'UiSelect',
    template: `
      <div class="ui-select-stub">
        <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value); $emit('change', $event.target.value)">
          <option v-for="opt in (options || [])" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    `,
    props: ['modelValue', 'options', 'prefix', 'size', 'pill', 'align', 'title'],
    emits: ['update:modelValue', 'change'],
  },
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}

describe('Product Reviews & Ratings System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.value = { id: 'usr-123', email: 'user@example.com' }

    mockFetch.mockImplementation((url: string, opts?: any) => {
      if (url.includes('/reviews/eligibility')) {
        return Promise.resolve({ success: true, data: mockEligibilityData })
      }
      if (url.includes('/reviews')) {
        const star = opts?.params?.star
        const filtered = star
          ? mockReviewsList.filter((r) => r.rating === Number(star))
          : mockReviewsList

        return Promise.resolve({
          success: true,
          reviews: filtered,
          summary: mockSummaryData,
          pagination: {
            page: 1,
            limit: 6,
            total: filtered.length,
            total_pages: 1,
          },
        })
      }
      return Promise.resolve({ success: true })
    })
  })

  describe('Review Utilities: Name Masking and Date Formatting', () => {
    it('masks full names with first name and last initial', () => {
      expect(formatReviewerName('Budi Santoso')).toBe('Budi S.')
      expect(formatReviewerName('Atsiila Arya')).toBe('Atsiila A.')
      expect(formatReviewerName('Citra Lestari Dewi')).toBe('Citra D.')
    })

    it('handles single names and email addresses cleanly', () => {
      expect(formatReviewerName('Atsiila')).toBe('Atsiila')
      expect(formatReviewerName('budi.santoso@example.com')).toBe('Budi S.')
      expect(formatReviewerName('')).toBe('Pelanggan ShelfStack')
      expect(formatReviewerName(null)).toBe('Pelanggan ShelfStack')
    })

    it('formats ISO dates cleanly into Indonesian locale', () => {
      const formatted = formatReviewDate('2026-10-28T10:00:00Z')
      expect(formatted).toContain('2026')
      expect(formatted).toContain('28')
    })
  })

  describe('ReviewRatingSummary Component', () => {
    it('renders average score, star glyphs, and total review count', () => {
      const wrapper = mount(ReviewRatingSummary, {
        props: {
          summary: mockSummaryData,
          selectedStar: null,
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('4.7')
      expect(wrapper.text()).toContain('/ 5.0')
      expect(wrapper.text()).toContain('3 ulasan pelanggan')
    })

    it('renders 5 star distribution rows with correct counts and percentages', () => {
      const wrapper = mount(ReviewRatingSummary, {
        props: {
          summary: mockSummaryData,
          selectedStar: null,
        },
        global: { stubs: globalStubs },
      })

      const rows = wrapper.findAll('button')
      expect(rows.length).toBe(5)
      // 5 star has count 2 (67%)
      expect(wrapper.text()).toContain('2 (67%)')
      // 4 star has count 1 (33%)
      expect(wrapper.text()).toContain('1 (33%)')
    })

    it('emits select-star event when a distribution bar is clicked', async () => {
      const wrapper = mount(ReviewRatingSummary, {
        props: {
          summary: mockSummaryData,
          selectedStar: null,
        },
        global: { stubs: globalStubs },
      })

      const star5Btn = wrapper.findAll('button')[0]
      await star5Btn.trigger('click')

      expect(wrapper.emitted('select-star')).toBeTruthy()
      expect(wrapper.emitted('select-star')![0]).toEqual([5])
    })
  })

  describe('ReviewCard Component (Strict Anti-Slop)', () => {
    it('renders masked reviewer name, date, star rating, and review text', () => {
      const wrapper = mount(ReviewCard, {
        props: {
          review: mockReviewsList[0],
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Budi S.')
      expect(wrapper.text()).toContain(mockReviewsList[0].review_text)
    })

    it('strictly does NOT render gaudy verified buyer badges', () => {
      const wrapper = mount(ReviewCard, {
        props: {
          review: mockReviewsList[0],
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).not.toContain('Pembeli Terverifikasi')
      expect(wrapper.text()).not.toContain('Verified Buyer')
      expect(wrapper.text()).not.toContain('Terverifikasi')
    })
  })

  describe('ReviewFilterBar Component', () => {
    it('renders star filter pills and emits select-star when clicked', async () => {
      const wrapper = mount(ReviewFilterBar, {
        props: {
          selectedStar: null,
          selectedSort: 'newest',
        },
        global: { stubs: globalStubs },
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(6) // Semua, 5, 4, 3, 2, 1 Bintang

      // Click 5 Bintang pill
      await buttons[1].trigger('click')
      expect(wrapper.emitted('select-star')).toBeTruthy()
      expect(wrapper.emitted('select-star')![0]).toEqual([5])
    })

    it('renders UiSelect for sorting and emits change-sort when changed', async () => {
      const wrapper = mount(ReviewFilterBar, {
        props: {
          selectedStar: 5,
          selectedSort: 'newest',
        },
        global: { stubs: globalStubs },
      })

      const selectStub = wrapper.findComponent({ name: 'UiSelect' })
      expect(selectStub.exists()).toBe(true)
      expect(selectStub.props('modelValue')).toBe('newest')
      expect(selectStub.props('prefix')).toBe('Urutkan:')
      expect(selectStub.props('size')).toBe('sm')
      expect(selectStub.props('pill')).toBe(true)

      // Emit change from UiSelect
      await selectStub.vm.$emit('update:modelValue', 'highest')
      expect(wrapper.emitted('change-sort')).toBeTruthy()
      expect(wrapper.emitted('change-sort')![0]).toEqual(['highest'])
    })
  })

  describe('ReviewFormModal Component', () => {
    it('displays interactive star rating picker with tactile hover and dynamic feedback', async () => {
      const wrapper = mount(ReviewFormModal, {
        props: {
          modelValue: true,
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
          orderId: 'ord-104',
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Tulis Ulasan Produk')
      expect(wrapper.text()).toContain('Meja Kerja Minimalis Oak')
      expect(wrapper.text()).toContain('Nomor Pesanan: #ord-104')
      expect(wrapper.text()).toContain('Pilih rating bintang')

      // Click 5th star
      const starBtns = wrapper.findAll('div[role="radiogroup"] button')
      expect(starBtns.length).toBe(5)

      await starBtns[4].trigger('click')
      expect(wrapper.text()).toContain('Sangat Memuaskan!')

      // Click 3rd star
      await starBtns[2].trigger('click')
      expect(wrapper.text()).toContain('Cukup')
    })

    it('shows character counter and helper warning when review text is less than 10 characters', async () => {
      const wrapper = mount(ReviewFormModal, {
        props: {
          modelValue: true,
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
          orderId: 'ord-104',
        },
        global: { stubs: globalStubs },
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Bagus')

      expect(wrapper.text()).toContain('Minimal 10 karakter')
      expect(wrapper.text()).toContain('5 / 1000 karakter')
    })

    it('validates rating and text before submitting', async () => {
      const wrapper = mount(ReviewFormModal, {
        props: {
          modelValue: true,
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
          orderId: 'ord-104',
        },
        global: { stubs: globalStubs },
      })

      // Submit without rating or text
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Silakan pilih rating bintang terlebih dahulu.')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('submits review successfully, displays toast, emits success, and closes modal', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const wrapper = mount(ReviewFormModal, {
        props: {
          modelValue: true,
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
          orderId: 'ord-104',
        },
        global: { stubs: globalStubs },
      })

      // Set 5 stars
      const starBtns = wrapper.findAll('div[role="radiogroup"] button')
      await starBtns[4].trigger('click')

      // Set valid text (> 10 characters)
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Material oak solid sangat kokoh dan estetik.')

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/101/reviews',
        expect.objectContaining({
          method: 'POST',
          body: {
            rating: 5,
            review_text: 'Material oak solid sangat kokoh dan estetik.',
            order_id: 'ord-104',
          },
        }),
      )

      expect(toastShowMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ulasan Anda berhasil diterbitkan.',
        }),
      )

      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('pre-fills data and submits PUT request when editing an existing review', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const existingReview = {
        id: 'rev-existing-1',
        rating: 4,
        review_text: 'Produk cukup bagus namun pengiriman agak lambat.',
      }

      const wrapper = mount(ReviewFormModal, {
        props: {
          modelValue: true,
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
          orderId: 'ord-104',
          existingReview,
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Bagus')
      const textarea = wrapper.find('textarea')
      expect((textarea.element as HTMLTextAreaElement).value).toBe(existingReview.review_text)

      // Update text and submit
      await textarea.setValue('Produk sangat memuaskan setelah dicoba seminggu.')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/101/reviews/rev-existing-1',
        expect.objectContaining({
          method: 'PUT',
          body: {
            rating: 4,
            review_text: 'Produk sangat memuaskan setelah dicoba seminggu.',
          },
        }),
      )
    })
  })

  describe('ProductReviewsSection Component', () => {
    it('renders section container with id="reviews" and summary bento', async () => {
      const wrapper = mount(ProductReviewsSection, {
        props: {
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
        },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      const section = wrapper.find('section#reviews')
      expect(section.exists()).toBe(true)
      expect(wrapper.text()).toContain('Ulasan Pelanggan')
      expect(wrapper.text()).toContain('3 ulasan')
    })

    it('renders filter pills and updates review list when clicking a filter pill', async () => {
      const wrapper = mount(ProductReviewsSection, {
        props: {
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
        },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      // Find 5 Bintang pill
      const pills = wrapper.findAll('div[role="toolbar"] button')
      expect(pills.length).toBe(6) // Semua, 5, 4, 3, 2, 1

      const pill5Star = pills[1]
      expect(pill5Star.text()).toContain('5 Bintang')

      await pill5Star.trigger('click')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/101/reviews',
        expect.objectContaining({
          params: expect.objectContaining({ star: 5 }),
        }),
      )
    })

    it('renders empty state when filtered reviews have 0 results', async () => {
      mockFetch.mockImplementation((url: string, opts?: any) => {
        if (url.includes('/reviews/eligibility')) {
          return Promise.resolve({ success: true, data: mockEligibilityData })
        }
        return Promise.resolve({
          success: true,
          reviews: [],
          summary: mockSummaryData,
        })
      })

      const wrapper = mount(ProductReviewsSection, {
        props: {
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
        },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Belum Ada Ulasan')
    })

    it('renders write review button when user is eligible', async () => {
      const wrapper = mount(ProductReviewsSection, {
        props: {
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
        },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Bagikan Pengalaman Anda')
      expect(wrapper.text()).toContain('Tulis Ulasan Produk')
    })

    it('renders existing review with edit and delete options when user has already reviewed', async () => {
      const userReview: ProductReview = {
        id: 'rev-my-1',
        product_id: 101,
        order_id: 'ord-101',
        user_name: 'Budi Santoso',
        rating: 5,
        review_text: 'Ulasan saya sebelumnya sangat puas dengan barang ini.',
        created_at: '2026-10-28T10:00:00Z',
      }

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews/eligibility')) {
          return Promise.resolve({
            success: true,
            data: {
              eligible: false,
              reason: 'already_reviewed',
              existing_review: userReview,
            },
          })
        }
        return Promise.resolve({
          success: true,
          reviews: [userReview],
          summary: mockSummaryData,
        })
      })

      const wrapper = mount(ProductReviewsSection, {
        props: {
          productId: 101,
          productName: 'Meja Kerja Minimalis Oak',
        },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Ulasan Anda')
      expect(wrapper.text()).toContain('Edit Ulasan')
      expect(wrapper.text()).toContain('Hapus')
    })
  })
})
