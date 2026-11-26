import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiInput from '~/components/ui/UiInput.vue'
import HomeAssurances from '~/components/home/HomeAssurances.vue'
import AuthDemoCredentialsBanner from '~/components/auth/AuthDemoCredentialsBanner.vue'

describe('Audit Remediation: Accessibility, Keyboard & Contrast Verification Suite', () => {
  it('UiInput: tombol toggle password dapat diakses via keyboard dan memiliki target sentuh minimal 44x44px', () => {
    const wrapper = mount(UiInput, {
      props: {
        modelValue: 'rahasia123',
        type: 'password',
        showPasswordToggle: true,
      },
    })

    const toggleBtn = wrapper.find('button[aria-label="Tampilkan kata sandi"]')
    expect(toggleBtn.exists()).toBe(true)
    // Verifikasi tabindex="-1" dihapus agar tombol dapat di-fokuskan dengan Tab
    expect(toggleBtn.attributes('tabindex')).toBeUndefined()

    // Verifikasi kelas ukuran target sentuh 44x44px
    expect(toggleBtn.classes()).toContain('min-w-[44px]')
    expect(toggleBtn.classes()).toContain('min-h-[44px]')
    expect(toggleBtn.classes()).toContain('w-11')
    expect(toggleBtn.classes()).toContain('h-11')
  })

  it('HomeAssurances: menampilkan garansi 7 hari retur yang konsisten dengan kebijakan resmi', () => {
    const wrapper = mount(HomeAssurances)
    expect(wrapper.text()).toContain('Garansi Retur 7 Hari')
    expect(wrapper.text()).not.toContain('Garansi Retur 30 Hari')
  })

  it('AuthDemoCredentialsBanner: selector demo menggunakan grid responsif vertikal pada mobile (grid-cols-1 sm:grid-cols-2)', () => {
    const wrapper = mount(AuthDemoCredentialsBanner)
    const grid = wrapper.find('.grid')
    expect(grid.exists()).toBe(true)
    expect(grid.classes()).toContain('grid-cols-1')
    expect(grid.classes()).toContain('sm:grid-cols-2')
  })

  it('main.css: token warna brand-warning-text memiliki rasio kontras WCAG AA (>= 4.5:1) sementara brand-warning cerah untuk ikon bintang', () => {
    const cssPath = resolve(process.cwd(), 'app/assets/css/main.css')
    const cssContent = readFileSync(cssPath, 'utf-8')
    expect(cssContent).toContain('--brand-warning: #f59e0b;')
    expect(cssContent).toContain('--brand-warning-text: #92400e;')
    expect(cssContent).not.toContain('--brand-warning: #e28e00;')
  })
})
