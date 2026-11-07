import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthDemoCredentialsBanner from '~/components/auth/AuthDemoCredentialsBanner.vue'

describe('AuthDemoCredentialsBanner Component', () => {
  it('renders quick fill buttons for customer and admin with password hint and roles', () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    expect(wrapper.text()).toContain('Akun Pengujian Demo')
    expect(wrapper.text()).toContain('Sandi: Password123!')
    expect(wrapper.text()).toContain('Pelanggan')
    expect(wrapper.text()).toContain('Etalase & Checkout')
    expect(wrapper.text()).toContain('Admin Ops')
    expect(wrapper.text()).toContain('Pesanan, Stok & CS')
    expect(wrapper.text()).toContain('demo-customer@')
    expect(wrapper.text()).toContain('demo-admin@')
  })

  it('emits selectDemo with customer credentials and shows active visual state', async () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    const customerBtn = wrapper.find('button[aria-label*="demo-customer@shelfstack.local"]')
    expect(customerBtn.exists()).toBe(true)

    await customerBtn.trigger('click')

    expect(wrapper.emitted('selectDemo')).toHaveLength(1)
    expect(wrapper.emitted('selectDemo')?.[0]).toEqual([
      {
        email: 'demo-customer@shelfstack.local',
        role: 'customer',
      },
    ])
    expect(customerBtn.classes()).toContain('border-brand-ink')
  })

  it('emits selectDemo with admin credentials and shows active visual state', async () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    const adminBtn = wrapper.find('button[aria-label*="demo-admin@shelfstack.local"]')
    expect(adminBtn.exists()).toBe(true)

    await adminBtn.trigger('click')

    expect(wrapper.emitted('selectDemo')).toHaveLength(1)
    expect(wrapper.emitted('selectDemo')?.[0]).toEqual([
      {
        email: 'demo-admin@shelfstack.local',
        role: 'admin',
      },
    ])
    expect(adminBtn.classes()).toContain('border-brand-ink')
  })
})
