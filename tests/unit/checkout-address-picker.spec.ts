import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AddressPickerModal from '~/components/checkout/AddressPickerModal.vue'
import AddressPickerCard from '~/components/checkout/AddressPickerCard.vue'
import type { UserAddress } from '~~/shared/schemas/address'

const mockAddresses = ref<UserAddress[]>([
  {
    id: 'addr-1',
    user_id: 'user-123',
    name: 'Atsiila Arya',
    phone: '081234567890',
    street: 'Jl. Sudirman No. 42',
    city: 'Jakarta Selatan',
    postal: '12110',
    note: 'Dekat lobby utama',
    is_default: true,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'addr-2',
    user_id: 'user-123',
    name: 'Kantor Tech',
    phone: '089876543210',
    street: 'Jl. Gatot Subroto Kav. 18',
    city: 'Jakarta Pusat',
    postal: '10270',
    note: 'Lantai 5',
    is_default: false,
    created_at: '2026-11-02T00:00:00Z',
    updated_at: '2026-11-02T00:00:00Z',
  },
])

const mockSelectDefault = vi.fn().mockResolvedValue({ success: true })
const mockSaveAddress = vi.fn().mockResolvedValue({
  id: 'addr-new',
  user_id: 'user-123',
  name: 'Alamat Baru',
  phone: '081122334455',
  street: 'Jl. Rasuna Said No. 1',
  city: 'Jakarta Selatan',
  postal: '12950',
  note: null,
  is_default: false,
  created_at: '2026-11-13T00:00:00Z',
  updated_at: '2026-11-13T00:00:00Z',
})
const mockFetchAddresses = vi.fn().mockResolvedValue(undefined)

vi.mock('~/composables/useAddresses', () => ({
  useAddresses: () => ({
    addresses: mockAddresses,
    loading: ref(false),
    error: ref<string | null>(null),
    fetchAddresses: mockFetchAddresses,
    saveAddress: mockSaveAddress,
    selectDefault: mockSelectDefault,
  }),
}))

describe('AddressPickerModal Component', () => {
  const globalStubs = {
    Teleport: true,
    UiModal: {
      template: `
        <div v-if="visible" class="mock-modal" role="dialog" aria-modal="true">
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
          <slot />
        </div>
      `,
      props: ['visible', 'title', 'description', 'size'],
    },
    UiButton: {
      template: '<button :class="variant" @click="$emit(\'click\', $event)"><slot /></button>',
      props: ['variant', 'size', 'icon'],
    },
    UiBadge: {
      template: '<span class="ui-badge">{{ label }}</span>',
      props: ['label', 'variant'],
    },
    UiEmptyState: {
      template:
        '<div class="ui-empty-state"><h4>{{ title }}</h4><button v-if="actionLabel" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
      props: ['icon', 'title', 'description', 'actionLabel'],
    },
    SavedAddressForm: {
      template:
        '<div class="mock-saved-address-form"><button @click="$emit(\'cancel\')">Cancel</button></div>',
      props: ['isSubmitting', 'error', 'initialDefault'],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when visible is true with address list', () => {
    const wrapper = mount(AddressPickerModal, {
      props: {
        visible: true,
        selectedId: 'addr-1',
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Pilih Alamat Pengiriman')
    expect(wrapper.text()).toContain('Atsiila Arya')
    expect(wrapper.text()).toContain('Kantor Tech')
    expect(wrapper.text()).toContain('Alamat Terpilih')
  })

  it('filters address cards by search query', async () => {
    const wrapper = mount(AddressPickerModal, {
      props: {
        visible: true,
        selectedId: 'addr-1',
      },
      global: {
        stubs: globalStubs,
      },
    })

    const searchInput = wrapper.find('input[type="search"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('Kantor')
    expect(wrapper.text()).toContain('Kantor Tech')
    expect(wrapper.text()).not.toContain('Atsiila Arya')
  })

  it('emits select when an address card is clicked', async () => {
    const wrapper = mount(AddressPickerModal, {
      props: {
        visible: true,
        selectedId: 'addr-1',
      },
      global: {
        stubs: globalStubs,
      },
    })

    const card = wrapper.findComponent(AddressPickerCard)
    expect(card.exists()).toBe(true)

    await card.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(mockAddresses.value[0])
    expect(wrapper.emitted('update:visible')?.[0]?.[0]).toBe(false)
  })

  it('toggles add address form when clicking + Tambah Alamat', async () => {
    const wrapper = mount(AddressPickerModal, {
      props: {
        visible: true,
        selectedId: 'addr-1',
      },
      global: {
        stubs: globalStubs,
      },
    })

    const addBtn = wrapper.find('[data-testid="modal-add-address-btn"]')
    expect(addBtn.exists()).toBe(true)

    await addBtn.trigger('click')
    expect(wrapper.text()).toContain('Tambah Alamat Pengiriman Baru')
    expect(wrapper.find('.mock-saved-address-form').exists()).toBe(true)
  })
})

describe('AddressPickerCard Component', () => {
  const dummyAddress: UserAddress = {
    id: 'addr-1',
    user_id: 'user-123',
    name: 'Atsiila Arya',
    phone: '081234567890',
    street: 'Jl. Sudirman No. 42',
    city: 'Jakarta Selatan',
    postal: '12110',
    note: 'Dekat lobby utama',
    is_default: true,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  }

  it('renders card details and default badge accurately', () => {
    const wrapper = mount(AddressPickerCard, {
      props: {
        address: dummyAddress,
        isSelected: true,
      },
      global: {
        stubs: {
          UiButton: true,
          UiBadge: {
            template: '<span>{{ label }}</span>',
            props: ['label'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Atsiila Arya')
    expect(wrapper.text()).toContain('081234567890')
    expect(wrapper.text()).toContain('Jl. Sudirman No. 42')
    expect(wrapper.text()).toContain('Jakarta Selatan')
    expect(wrapper.text()).toContain('Kode Pos: 12110')
    expect(wrapper.text()).toContain('Patokan: Dekat lobby utama')
    expect(wrapper.text()).toContain('Utama')
    expect(wrapper.text()).toContain('Alamat Terpilih')
    expect(wrapper.text()).not.toContain('—') // No em dashes
  })
})
