import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ContactPage from '~/pages/contact.vue'
import UiSelect from '~/components/ui/UiSelect.vue'

const { mockShowToast } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
}))

vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    show: mockShowToast,
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  }),
}))

const globalStubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
  UiButton: {
    template: `
      <NuxtLink
        v-if="to"
        :to="to"
        class="ui-button"
        :data-variant="variant"
      >
        <slot />
      </NuxtLink>
      <button
        v-else
        :type="type || 'button'"
        :disabled="disabled || loading"
        :data-loading="loading"
        @click="$emit('click', $event)"
      >
        <slot />
      </button>
    `,
    props: ['type', 'variant', 'to', 'size', 'icon', 'iconPos', 'loading', 'disabled', 'block'],
  },
}

describe('Contact Page (app/pages/contact.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('merender saluran resmi, informasi layanan, dan tombol tautan cepat ke /help dan /tracking', () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('support@shelfstack.id')
    expect(text).toContain('Semarang, Jawa Tengah 50181')
    expect(text).toContain('Senin - Jumat 09:00 - 18:00 WIB')

    const helpLink = wrapper.find('a[href="/help"]')
    expect(helpLink.exists()).toBe(true)
    expect(helpLink.text()).toContain('Pusat Bantuan & FAQ')

    const trackingLink = wrapper.find('a[href="/tracking"]')
    expect(trackingLink.exists()).toBe(true)
    expect(trackingLink.text()).toContain('Lacak Status Pesanan')
  })

  it('menampilkan pesan error inline saat formulir disubmit tanpa mengisi field wajib', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Nama lengkap wajib diisi')
    expect(text).toContain('Alamat email wajib diisi')
    expect(text).toContain('Silakan pilih kategori pertanyaan')
    expect(text).toContain('Pesan atau kendala wajib diisi')

    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('memvalidasi batas minimum nama lengkap (kurang dari 3 karakter)', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const nameInput = wrapper.find('#contact-name')
    await nameInput.setValue('Ab')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Nama lengkap minimal 3 karakter')
  })

  it('memvalidasi format email yang tidak valid', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const emailInput = wrapper.find('#contact-email')
    await emailInput.setValue('bukan-email-valid')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Format alamat email tidak valid')
  })

  it('memvalidasi batas minimum karakter pesan (kurang dari 10 karakter)', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const messageInput = wrapper.find('#contact-message')
    await messageInput.setValue('Halo')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Pesan minimal 10 karakter')
  })

  it('berhasil mengirim pesan jika semua input valid, menampilkan toast sukses, dan mereset form', async () => {
    const wrapper = mount(ContactPage, {
      global: {
        stubs: globalStubs,
      },
    })

    // Isi field form dengan data valid
    await wrapper.find('#contact-name').setValue('Arya Danu')
    await wrapper.find('#contact-email').setValue('arya@example.com')

    // Pilih kategori pertanyaan lewat UiSelect
    const uiSelectComponent = wrapper.findComponent(UiSelect)
    await uiSelectComponent.vm.$emit('update:modelValue', 'Pertanyaan Produk')

    await wrapper.find('#contact-order-number').setValue('ORD-20261028-1001')
    await wrapper
      .find('#contact-message')
      .setValue('Saya ingin menanyakan ketersediaan stok untuk Billet Aluminum Shelf.')

    // Submit form
    await wrapper.find('form').trigger('submit')

    // Simulasi delay asynchronous
    await vi.advanceTimersByTimeAsync(600)
    await flushPromises()

    // Verifikasi pemanggilan toast notifikasi
    expect(mockShowToast).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Pesan Terkirim',
      message: 'Tim dukungan ShelfStack akan merespons dalam 1x24 jam kerja.',
      tone: 'success',
    })

    // Verifikasi form state telah di-reset
    const nameInput = wrapper.find<HTMLInputElement>('#contact-name')
    const emailInput = wrapper.find<HTMLInputElement>('#contact-email')
    const orderInput = wrapper.find<HTMLInputElement>('#contact-order-number')
    const messageInput = wrapper.find<HTMLTextAreaElement>('#contact-message')

    expect(nameInput.element.value).toBe('')
    expect(emailInput.element.value).toBe('')
    expect(orderInput.element.value).toBe('')
    expect(messageInput.element.value).toBe('')
  })
})
