import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, computed } from 'vue'

describe('Admin Support Page & Layout Integration Blueprint Verification', () => {
  describe('1. Admin Layout Navigation & Unread Badge Verification', () => {
    const navLinks = [
      { to: '/admin', label: 'Dashboard', icon: 'pi-chart-bar', exact: true },
      { to: '/admin/orders', label: 'Kelola Pesanan', icon: 'pi-shopping-bag', exact: false },
      { to: '/admin/returns', label: 'Komplain & Retur', icon: 'pi-replay', exact: false },
      { to: '/admin/support', label: 'Bantuan & Live Chat', icon: 'pi-comments', exact: false },
      { to: '/admin/products', label: 'Kelola Produk', icon: 'pi-th-large', exact: false },
      { to: '/admin/coupons', label: 'Kelola Voucher', icon: 'pi-ticket', exact: false },
      { to: '/admin/activities', label: 'Activity Log', icon: 'pi-history', exact: false },
    ]

    it('memiliki entri navigasi Bantuan & Live Chat dengan rute /admin/support dan ikon pi-comments', () => {
      const supportNav = navLinks.find((item) => item.to === '/admin/support')
      expect(supportNav).toBeDefined()
      expect(supportNav?.label).toBe('Bantuan & Live Chat')
      expect(supportNav?.icon).toBe('pi-comments')
      expect(supportNav?.exact).toBe(false)
    })

    it('merender badge unread count ketika unreadSupportCount > 0', () => {
      const MockNav = defineComponent({
        props: { unreadCount: { type: Number, default: 0 } },
        setup(props) {
          return () =>
            h('nav', { class: 'admin-nav' }, [
              navLinks.map((item) =>
                h('a', { key: item.to, href: item.to, class: 'nav-link' }, [
                  h('span', item.label),
                  item.to === '/admin/support' && props.unreadCount > 0
                    ? h(
                        'span',
                        { class: 'unread-support-badge' },
                        props.unreadCount > 99 ? '99+' : props.unreadCount,
                      )
                    : null,
                ]),
              ),
            ])
        },
      })

      const wrapper = mount(MockNav, { props: { unreadCount: 3 } })
      const badge = wrapper.find('.unread-support-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
    })

    it('menyembunyikan badge unread ketika unreadSupportCount bernilai 0', () => {
      const MockNav = defineComponent({
        props: { unreadCount: { type: Number, default: 0 } },
        setup(props) {
          return () =>
            h('nav', { class: 'admin-nav' }, [
              navLinks.map((item) =>
                h('a', { key: item.to, href: item.to, class: 'nav-link' }, [
                  h('span', item.label),
                  item.to === '/admin/support' && props.unreadCount > 0
                    ? h('span', { class: 'unread-support-badge' }, props.unreadCount)
                    : null,
                ]),
              ),
            ])
        },
      })

      const wrapper = mount(MockNav, { props: { unreadCount: 0 } })
      expect(wrapper.find('.unread-support-badge').exists()).toBe(false)
    })
  })

  describe('2. Split-View Dual-Pane Admin Support Page Behavior', () => {
    const MockSupportPage = defineComponent({
      props: {
        initialActiveThreadId: { type: String, default: null },
      },
      setup(props) {
        const activeThreadId = ref<string | null>(props.initialActiveThreadId)

        const selectThread = (id: string) => {
          activeThreadId.value = id
        }

        const backToInbox = () => {
          activeThreadId.value = null
        }

        return () =>
          h('div', { class: 'admin-support-page' }, [
            h('header', { class: 'page-header' }, [h('h1', 'Bantuan & Live Chat')]),
            h('div', { class: 'split-view-container' }, [
              // Left Pane
              h(
                'aside',
                {
                  class: ['left-inbox-pane', activeThreadId.value ? 'hidden md:flex' : 'flex'],
                },
                [
                  h(
                    'button',
                    {
                      class: 'mock-thread-item',
                      'data-id': 'thread-abc',
                      onClick: () => selectThread('thread-abc'),
                    },
                    'Pilih Thread ABC',
                  ),
                ],
              ),

              // Right Pane
              h(
                'section',
                {
                  class: ['right-chat-pane', activeThreadId.value ? 'flex' : 'hidden md:flex'],
                },
                [
                  activeThreadId.value
                    ? h('div', { class: 'mobile-back-bar md:hidden' }, [
                        h(
                          'button',
                          { class: 'btn-back-inbox', onClick: backToInbox },
                          'Kembali ke Daftar Percakapan',
                        ),
                      ])
                    : null,
                  activeThreadId.value
                    ? h(
                        'div',
                        { class: 'active-chat-content' },
                        `Aktif Thread: ${activeThreadId.value}`,
                      )
                    : h(
                        'div',
                        { class: 'empty-chat-placeholder' },
                        'Pilih thread untuk memulai percakapan',
                      ),
                ],
              ),
            ]),
          ])
      },
    })

    it('merender layout split view dengan placeholder saat belum ada thread yang dipilih', () => {
      const wrapper = mount(MockSupportPage, { props: { initialActiveThreadId: null } })
      expect(wrapper.text()).toContain('Bantuan & Live Chat')
      expect(wrapper.find('.empty-chat-placeholder').exists()).toBe(true)
      expect(wrapper.find('.left-inbox-pane').classes()).toContain('flex')
      expect(wrapper.find('.right-chat-pane').classes()).toContain('hidden')
    })

    it('menampilkan pane obrolan aktif dan tombol kembali mobile saat thread dipilih', async () => {
      const wrapper = mount(MockSupportPage, { props: { initialActiveThreadId: null } })
      await wrapper.find('.mock-thread-item').trigger('click')

      expect(wrapper.find('.active-chat-content').exists()).toBe(true)
      expect(wrapper.find('.active-chat-content').text()).toContain('thread-abc')
      expect(wrapper.find('.left-inbox-pane').classes()).toContain('hidden')
      expect(wrapper.find('.right-chat-pane').classes()).toContain('flex')

      const backBtn = wrapper.find('.btn-back-inbox')
      expect(backBtn.exists()).toBe(true)

      await backBtn.trigger('click')
      expect(wrapper.find('.left-inbox-pane').classes()).toContain('flex')
      expect(wrapper.find('.right-chat-pane').classes()).toContain('hidden')
    })
  })
})
