import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthDemoCredentialsBanner from '~/components/auth/AuthDemoCredentialsBanner.vue'

describe('AuthDemoCredentialsBanner Component', () => {
  it('renders quick fill buttons for customer and admin', () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    expect(wrapper.text()).toContain('Kredensial Demo 1-Klik')
    expect(wrapper.text()).toContain('Pelanggan')
    expect(wrapper.text()).toContain('Admin Ops')
    expect(wrapper.text()).toContain('customer@shelfstack.local')
    expect(wrapper.text()).toContain('admin@shelfstack.local')
  })

  it('emits selectDemo with customer credentials when customer button is clicked', async () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    const customerBtn = wrapper.find('button[aria-label*="pelanggan"]')
    expect(customerBtn.exists()).toBe(true)

    await customerBtn.trigger('click')

    expect(wrapper.emitted('selectDemo')).toHaveLength(1)
    expect(wrapper.emitted('selectDemo')?.[0]).toEqual([
      {
        email: 'customer@shelfstack.local',
        role: 'customer',
      },
    ])
  })

  it('emits selectDemo with admin credentials when admin button is clicked', async () => {
    const wrapper = mount(AuthDemoCredentialsBanner)

    const adminBtn = wrapper.find('button[aria-label*="admin"]')
    expect(adminBtn.exists()).toBe(true)

    await adminBtn.trigger('click')

    expect(wrapper.emitted('selectDemo')).toHaveLength(1)
    expect(wrapper.emitted('selectDemo')?.[0]).toEqual([
      {
        email: 'admin@shelfstack.local',
        role: 'admin',
      },
    ])
  })
})
