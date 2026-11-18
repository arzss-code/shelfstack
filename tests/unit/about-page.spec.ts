import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutPage from '~/pages/about.vue'

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
      >
        <slot />
      </button>
    `,
    props: ['type', 'variant', 'to', 'size', 'icon', 'iconPos', 'loading', 'disabled'],
  },
}

describe('About Page (app/pages/about.vue)', () => {
  it('merender misi kurasi dan target profesional digital', () => {
    const wrapper = mount(AboutPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Single-Vendor Curated Storefront')
    expect(text).toContain(
      'Ruang Kerja Presisi untuk Profesional Digital, Engineer, dan Studio Kreatif',
    )
    expect(text).toContain('Filosofi Kurasi')
  })

  it('merender Proven Stats Strip dengan angka dan label yang tepat', () => {
    const wrapper = mount(AboutPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('5 Kategori')
    expect(text).toContain('Koleksi Terkurasi')
    expect(text).toContain('100%')
    expect(text).toContain('Lulus Uji Standar')
    expect(text).toContain('2 Tahun')
    expect(text).toContain('Garansi Resmi')
    expect(text).toContain('Pengiriman Cepat Seluruh Indonesia')
  })

  it('merender tiga pilar komitmen rekayasa ShelfStack', () => {
    const wrapper = mount(AboutPage, {
      global: {
        stubs: globalStubs,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Material Presisi')
    expect(text).toContain(
      'Billet 6063 Aluminum, Solid American Walnut, Studio Acoustic Engineering',
    )

    expect(text).toContain('Transparansi & Keaslian')
    expect(text).toContain('100% Produk Original dengan Garansi Resmi 2 Tahun')

    expect(text).toContain('Kurasi Tanpa Kompromi')
    expect(text).toContain('Setiap unit melalui pengujian ergonomi dan durabilitas nyata')
  })

  it('merender direct CTA strip dengan tautan ke /katalog', () => {
    const wrapper = mount(AboutPage, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Temukan Perangkat Meja Kerja Anda')

    const katalogLink = wrapper.find('a[href="/katalog"]')
    expect(katalogLink.exists()).toBe(true)
    expect(katalogLink.text()).toContain('Eksplorasi Katalog Produk')
  })
})
