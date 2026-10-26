import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiInput from '~/components/ui/UiInput.vue'
import AuthFormInput from '~/components/auth/AuthFormInput.vue'
import AuthCard from '~/components/auth/AuthCard.vue'

describe('Auth Redesign & Show Password Toggle', () => {
  it('UiInput toggles between password and text when showPasswordToggle is active', async () => {
    const wrapper = mount(UiInput, {
      props: {
        modelValue: 'secret123',
        type: 'password',
        showPasswordToggle: true,
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('password')

    const toggleButton = wrapper.find('button[type="button"]')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.attributes('aria-label')).toBe('Tampilkan kata sandi')
    expect(wrapper.find('i.pi-eye').exists()).toBe(true)

    // Klik tombol untuk menampilkan kata sandi
    await toggleButton.trigger('click')
    expect(input.attributes('type')).toBe('text')
    expect(toggleButton.attributes('aria-label')).toBe('Sembunyikan kata sandi')
    expect(wrapper.find('i.pi-eye-slash').exists()).toBe(true)

    // Klik lagi untuk menyembunyikan kembali
    await toggleButton.trigger('click')
    expect(input.attributes('type')).toBe('password')
    expect(wrapper.find('i.pi-eye').exists()).toBe(true)
  })

  it('UiInput does not show toggle button for text inputs', () => {
    const wrapper = mount(UiInput, {
      props: {
        modelValue: 'user@example.com',
        type: 'text',
        showPasswordToggle: true,
      },
    })

    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })

  it('AuthFormInput passes showPasswordToggle by default when type is password', async () => {
    const wrapper = mount(AuthFormInput, {
      props: {
        id: 'pwd',
        label: 'Kata Sandi',
        type: 'password',
        modelValue: 'pass1234',
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('password')

    const button = wrapper.find('button[type="button"]')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    expect(input.attributes('type')).toBe('text')
  })

  it('AuthCard renders two-column split layout without legacy trust badges', () => {
    const wrapper = mount(AuthCard, {
      props: {
        title: 'Masuk Akun',
        subtitle: 'Silakan masuk untuk melanjutkan transaksi.',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
          AppLogo: {
            template: '<div class="app-logo-stub" />',
          },
        },
      },
    })

    // Header form
    expect(wrapper.find('h1').text()).toBe('Masuk Akun')
    expect(wrapper.text()).toContain('Silakan masuk untuk melanjutkan transaksi.')

    // Left visual showcase
    expect(wrapper.text()).toContain('Furnitur dan perlengkapan kerja')
    expect(wrapper.text()).toContain('Pilihan meja, kursi ergonomis, dan rak penyimpanan')
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/auth-showcase.jpg')
    expect(img.attributes('alt')).toBe('Display rak dan furnitur ShelfStack')

    // Verifikasi tiadanya trust badges dan copywriting AI klise
    expect(wrapper.text()).not.toContain('Kurasi Resmi ShelfStack')
    expect(wrapper.text()).not.toContain('Belanja Aman')
    expect(wrapper.text()).not.toContain('Privasi Terjaga')
    expect(wrapper.text()).not.toContain('Keamanan Terjamin')
  })
})
