import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminStatCard from '../../app/features/admin/components/AdminStatCard.vue'

const globalStubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}

describe('AdminStatCard Component', () => {
  it('merender anchor tautan nyata (bukan tag kustom nuxtlink) ketika prop to diisi', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/features/admin/components/AdminStatCard.vue'),
      'utf-8',
    )
    expect(source).toContain("import { NuxtLink } from '#components'")
    expect(source).not.toContain(":is=\"to ? 'NuxtLink'")

    const wrapper = mount(AdminStatCard, {
      props: {
        title: 'Pesanan Menunggu',
        value: '4',
        subtitle: 'Menunggu bayar atau konfirmasi',
        icon: 'pi-clock',
        color: 'warning',
        to: '/admin/orders?status=pending',
      },
      global: { stubs: globalStubs },
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(wrapper.find('nuxtlink').exists()).toBe(false)
    expect(link.attributes('href')).toBe('/admin/orders?status=pending')
    expect(wrapper.text()).toContain('Pesanan Menunggu')
    expect(wrapper.text()).toContain('Lihat')
  })

  it('merender div statis tanpa tautan ketika prop to kosong', () => {
    const wrapper = mount(AdminStatCard, {
      props: {
        title: 'Ringkasan Pasif',
        value: 'Rp 0',
        subtitle: 'Tanpa navigasi',
        icon: 'pi-chart-bar',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.attributes('to')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Lihat')
  })
})
