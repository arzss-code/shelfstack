import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckoutCoinsToggle from '../../app/components/checkout/CheckoutCoinsToggle.vue'
import { formatRupiah } from '../../app/utils/format'

describe('CheckoutCoinsToggle [SHF-LOYALTY-COINS-CHECKOUT]', () => {
  it('menampilkan opsi penukaran koin saat saldo dan subtotal memenuhi syarat', () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: false,
        balanceCoins: 10000,
        maxUsableCoins: 5000,
        disabled: false,
      },
    })

    expect(wrapper.text()).toContain('Tukarkan ShelfStack Koin')
    expect(wrapper.text()).toContain('Tersedia 10.000 Koin')
    expect(wrapper.text()).toContain('(1 Koin = Rp 1)')
    expect(wrapper.text()).toContain(
      `Pakai 5.000 Koin untuk hemat ${formatRupiah(5000)} (Maks. 50% subtotal).`,
    )

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    expect(switchBtn.exists()).toBe(true)
    expect(switchBtn.attributes('aria-checked')).toBe('false')
    expect(switchBtn.attributes('disabled')).toBeUndefined()
  })

  it('mengirimkan event update:modelValue saat tombol toggle diklik', async () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: false,
        balanceCoins: 15000,
        maxUsableCoins: 7500,
        disabled: false,
      },
    })

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    await switchBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('menampilkan status aktif dan teks hemat saat modelValue bernilai true', () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: true,
        balanceCoins: 20000,
        maxUsableCoins: 10000,
        disabled: false,
      },
    })

    expect(wrapper.text()).toContain(
      `Hemat ${formatRupiah(10000)} (10.000 Koin) berhasil diterapkan ke pesanan.`,
    )

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    expect(switchBtn.attributes('aria-checked')).toBe('true')
  })

  it('mendukung aksesibilitas keyboard menggunakan tombol Space dan Enter', async () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: false,
        balanceCoins: 10000,
        maxUsableCoins: 5000,
        disabled: false,
      },
    })

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    await switchBtn.trigger('keydown.space')
    await switchBtn.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')?.length).toBe(2)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([true])
  })

  it('menonaktifkan switch dan menampilkan pesan saldo nol saat balanceCoins <= 0', async () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: false,
        balanceCoins: 0,
        maxUsableCoins: 0,
        disabled: false,
      },
    })

    expect(wrapper.text()).toContain('Saldo koin 0. Belanja untuk kumpulkan cashback koin 1%.')
    expect(wrapper.text()).not.toContain('Tersedia 0 Koin')

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    expect(switchBtn.attributes('disabled')).toBeDefined()
    expect(switchBtn.attributes('aria-checked')).toBe('false')

    await switchBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('menonaktifkan switch saat subtotal belanja belum memenuhi syarat (maxUsableCoins == 0)', async () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: false,
        balanceCoins: 10000,
        maxUsableCoins: 0,
        disabled: false,
      },
    })

    expect(wrapper.text()).toContain('Subtotal belum memenuhi syarat pemakaian koin.')

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    expect(switchBtn.attributes('disabled')).toBeDefined()

    await switchBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('menonaktifkan switch saat prop disabled bernilai true', async () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: true,
        balanceCoins: 10000,
        maxUsableCoins: 5000,
        disabled: true,
      },
    })

    const switchBtn = wrapper.find('[data-testid="coins-toggle-switch"]')
    expect(switchBtn.attributes('disabled')).toBeDefined()

    await switchBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('mematuhi anti-slop tanpa karakter em dash di seluruh teks antarmuka', () => {
    const wrapper = mount(CheckoutCoinsToggle, {
      props: {
        modelValue: true,
        balanceCoins: 10000,
        maxUsableCoins: 5000,
        disabled: false,
      },
    })

    expect(wrapper.html()).not.toContain('—')
    expect(wrapper.html()).not.toContain('–')
  })
})
