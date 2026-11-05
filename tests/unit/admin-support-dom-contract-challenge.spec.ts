import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminSupportInboxList from '../../app/components/admin/support/AdminSupportInboxList.vue'
import AdminCannedResponseMenu from '../../app/components/admin/support/AdminCannedResponseMenu.vue'
import AdminSupportChatPane from '../../app/components/admin/support/AdminSupportChatPane.vue'

describe('Admin Support DOM Contract Empirical Challenger Suite', () => {
  describe('1. AdminSupportInboxList DOM Contract & Interactions', () => {
    const sampleThreads = [
      {
        id: 'thread-001',
        customer_name: 'Budi Santoso',
        customer_email: 'budi@example.com',
        status: 'waiting_admin',
        last_message_text: 'Mohon info resi paket saya',
        last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        unread_by_admin_count: 3,
        customer_avatar_url: null,
      },
      {
        id: 'thread-002',
        customer_name: 'Dewi Lestari',
        customer_email: 'dewi@example.com',
        status: 'open',
        last_message_text: 'Halo ada barang ready?',
        last_message_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        unread_by_admin_count: 1,
        customer_avatar_url: 'https://example.com/avatar-dewi.jpg',
      },
      {
        id: 'thread-003',
        customer_name: 'Citra Kirana',
        customer_email: 'citra@example.com',
        status: 'resolved',
        last_message_text: 'Terima kasih bantuannya',
        last_message_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        unread_by_admin_count: 0,
      },
    ]

    it('merender kedua kelas .thread-card dan .thread-item untuk setiap thread', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const cards = wrapper.findAll('.thread-card')
      const items = wrapper.findAll('.thread-item')
      expect(cards.length).toBe(3)
      expect(items.length).toBe(3)
      expect(cards[0].attributes('data-id')).toBe('thread-001')
    })

    it('menandai thread aktif dengan kelas .active-thread dan .is-active', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads, activeThreadId: 'thread-002' },
      })
      const activeCard = wrapper.find('.active-thread')
      expect(activeCard.exists()).toBe(true)
      expect(activeCard.classes()).toContain('is-active')
      expect(activeCard.attributes('data-id')).toBe('thread-002')
    })

    it('merender seluruh 5 tab filter status: all, open, waiting_admin, waiting_customer, resolved', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads, filterStatus: 'waiting_admin' },
      })
      const expectedTabs = ['all', 'open', 'waiting_admin', 'waiting_customer', 'resolved']
      const tabElements = wrapper.findAll('.filter-tab')
      expect(tabElements.length).toBe(5)

      for (const tabKey of expectedTabs) {
        const btn = wrapper.find(`button[data-status="${tabKey}"]`)
        expect(btn.exists()).toBe(true)
      }

      const activeTab = wrapper.find('button.active-tab')
      expect(activeTab.attributes('data-status')).toBe('waiting_admin')
    })

    it('memancarkan updateFilter ketika tab status diklik', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const resolvedTab = wrapper.find('button[data-status="resolved"]')
      await resolvedTab.trigger('click')
      expect(wrapper.emitted('updateFilter')).toBeTruthy()
      expect(wrapper.emitted('updateFilter')?.[0]).toEqual(['resolved'])
    })

    it('merender input.search-input dan memancarkan updateSearch saat admin mengetik', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads, searchQuery: '' },
      })
      const searchInput = wrapper.find('input.search-input')
      expect(searchInput.exists()).toBe(true)
      await searchInput.setValue('Dewi')
      expect(wrapper.emitted('updateSearch')).toBeTruthy()
      expect(wrapper.emitted('updateSearch')?.[0]).toEqual(['Dewi'])
    })

    it('memancarkan selectThread saat kartu thread diklik', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const firstCard = wrapper.find('.thread-card')
      await firstCard.trigger('click')
      expect(wrapper.emitted('selectThread')).toBeTruthy()
      expect(wrapper.emitted('selectThread')?.[0]).toEqual(['thread-001'])
    })

    it('mengecek apakah select dipancarkan secara bersamaan dengan selectThread', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const firstCard = wrapper.find('.thread-card')
      await firstCard.trigger('click')
      // Sesuai temuan kode: AdminSupportInboxList hanya mendefinisikan selectThread
      expect(wrapper.emitted('selectThread')).toBeTruthy()
      expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('merender inisial avatar jika tidak ada URL foto, dan tag img jika ada foto', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const cards = wrapper.findAll('.thread-card')

      // Thread 1: tanpa avatar url -> inisial BS (Budi Santoso)
      expect(cards[0].find('.customer-avatar img').exists()).toBe(false)
      expect(cards[0].find('.customer-avatar span').text()).toBe('BS')

      // Thread 2: dengan avatar url
      expect(cards[1].find('.customer-avatar img').exists()).toBe(true)
      expect(cards[1].find('.customer-avatar img').attributes('src')).toBe(
        'https://example.com/avatar-dewi.jpg',
      )
    })

    it('merender badge unread hanya pada thread dengan unread_by_admin_count > 0', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: sampleThreads },
      })
      const cards = wrapper.findAll('.thread-card')
      expect(cards[0].find('.unread-admin-badge').text()).toBe('3')
      expect(cards[1].find('.unread-admin-badge').text()).toBe('1')
      expect(cards[2].find('.unread-admin-badge').exists()).toBe(false)
    })

    it('menampilkan .empty-inbox ketika tidak ada thread', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: [] },
      })
      expect(wrapper.find('.empty-inbox').exists()).toBe(true)
      expect(wrapper.find('.empty-inbox').text()).toContain('Tidak ada pesan bantuan ditemukan')
    })
  })

  describe('2. AdminCannedResponseMenu DOM Contract & 1-Click Selection', () => {
    it('merender tepat 5 template respon cepat standar dengan kelas .canned-item dan .canned-response-btn', () => {
      const wrapper = mount(AdminCannedResponseMenu)
      const buttons = wrapper.findAll('button.canned-item')
      expect(buttons.length).toBe(5)

      for (const btn of buttons) {
        expect(btn.classes()).toContain('canned-response-btn')
      }
    })

    it('memancarkan KEDUA event select dan selectResponse saat template diklik', async () => {
      const wrapper = mount(AdminCannedResponseMenu)
      const greetingBtn = wrapper.find('button[data-key="greeting"]')
      expect(greetingBtn.exists()).toBe(true)

      await greetingBtn.trigger('click')
      const expectedText = 'Halo! Ada yang bisa kami bantu terkait pesanan Anda hari ini?'

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0]).toEqual([expectedText])

      expect(wrapper.emitted('selectResponse')).toBeTruthy()
      expect(wrapper.emitted('selectResponse')?.[0]).toEqual([expectedText])
    })

    it('memiliki 5 respon dengan key unik: greeting, ask_order_id, shipping_info, refund_processed, closing_resolved', () => {
      const wrapper = mount(AdminCannedResponseMenu)
      const expectedKeys = [
        'greeting',
        'ask_order_id',
        'shipping_info',
        'refund_processed',
        'closing_resolved',
      ]

      for (const key of expectedKeys) {
        expect(wrapper.find(`button[data-key="${key}"]`).exists()).toBe(true)
      }
    })
  })

  describe('3. AdminSupportChatPane DOM Contract & Message Stream', () => {
    const mockThread = {
      id: 'thread-active-99',
      customer_name: 'Rudi Hartono',
      customer_email: 'rudi@example.com',
      status: 'waiting_admin',
      customer_avatar_url: null,
    }

    const mockMessages = [
      {
        id: 'msg-1',
        sender_type: 'customer' as const,
        message_text: 'Paket saya belum sampai.',
        created_at: '2026-11-04T05:00:00Z',
        attachment_url: 'https://example.com/receipt.jpg',
      },
      {
        id: 'msg-2',
        sender_type: 'system' as const,
        message_text: 'Halo! Selamat datang di layanan bantuan ShelfStack.',
        created_at: '2026-11-04T05:00:05Z',
      },
      {
        id: 'msg-3',
        sender_type: 'admin' as const,
        message_text: 'Sedang kami cek ke tim ekspedisi.',
        created_at: '2026-11-04T05:05:00Z',
      },
    ]

    it('menampilkan .empty-pane ketika thread bernilai null / undefined', () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: null },
      })
      expect(wrapper.find('.empty-pane').exists()).toBe(true)
      expect(wrapper.find('.active-pane').exists()).toBe(false)
    })

    it('merender header pelanggan, avatar inisial, status badge, status select, dan tombol resolve', () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: [] },
      })
      expect(wrapper.find('.customer-name').text()).toBe('Rudi Hartono')
      expect(wrapper.find('.customer-email').text()).toBe('rudi@example.com')
      expect(wrapper.find('.customer-avatar span').text()).toBe('RH')

      const badge = wrapper.find('.status-badge')
      expect(badge.text()).toBe('waiting_admin')
      expect(badge.attributes('data-status')).toBe('waiting_admin')

      const select = wrapper.find('select.status-select')
      expect(select.exists()).toBe(true)
      expect((select.element as HTMLSelectElement).value).toBe('waiting_admin')

      const resolveBtn = wrapper.find('button.btn-resolve')
      expect(resolveBtn.exists()).toBe(true)
      expect(resolveBtn.text()).toContain('Selesaikan Tiket')
    })

    it('memancarkan updateStatus ke resolved saat tombol Selesaikan Tiket diklik', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: [] },
      })
      await wrapper.find('button.btn-resolve').trigger('click')
      expect(wrapper.emitted('updateStatus')).toBeTruthy()
      expect(wrapper.emitted('updateStatus')?.[0]).toEqual(['resolved'])
    })

    it('memancarkan updateStatus saat dropdown status select diubah', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: [] },
      })
      const select = wrapper.find('select.status-select')
      await select.setValue('waiting_customer')
      expect(wrapper.emitted('updateStatus')).toBeTruthy()
      expect(wrapper.emitted('updateStatus')?.[0]).toEqual(['waiting_customer'])
    })

    it('merender ketiga varian bubble: .customer-bubble, .admin-bubble, dan .system-bubble', () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: mockMessages },
      })
      expect(wrapper.find('.customer-bubble').exists()).toBe(true)
      expect(wrapper.find('.customer-bubble').text()).toContain('Paket saya belum sampai.')

      expect(wrapper.find('.system-bubble').exists()).toBe(true)
      expect(wrapper.find('.system-bubble').text()).toContain('layanan bantuan ShelfStack')

      expect(wrapper.find('.admin-bubble').exists()).toBe(true)
      expect(wrapper.find('.admin-bubble').text()).toContain('Sedang kami cek ke tim ekspedisi.')
    })

    it('merender thumbnail pratinjau lampiran gambar dan membuka lightbox saat diklik', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: mockMessages },
      })
      const img = wrapper.find('img.attachment-preview')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/receipt.jpg')

      // Lightbox belum aktif
      expect(wrapper.find('img[alt="Pratinjau lampiran"]').exists()).toBe(false)

      // Klik thumbnail
      await img.trigger('click')

      // Lightbox muncul
      const lightboxImg = wrapper.find('img[alt="Pratinjau lampiran"]')
      expect(lightboxImg.exists()).toBe(true)
      expect(lightboxImg.attributes('src')).toBe('https://example.com/receipt.jpg')

      // Tutup lightbox dengan tombol close
      const closeBtn = wrapper.find('button[aria-label="Tutup pratinjau"]')
      await closeBtn.trigger('click')
      expect(wrapper.find('img[alt="Pratinjau lampiran"]').exists()).toBe(false)
    })

    it('memverifikasi composer: textarea dengan counter 1000 dan tombol send disabled bila kosong', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: [] },
      })

      const textarea = wrapper.find('textarea.composer-textarea')
      expect(textarea.exists()).toBe(true)
      expect(textarea.attributes('maxlength')).toBe('1000')

      const counter = wrapper.find('.char-counter')
      expect(counter.text()).toBe('0/1000')

      const sendBtn = wrapper.find('button.btn-admin-send')
      expect(sendBtn.classes()).toContain('btn-send')
      expect(sendBtn.attributes('disabled')).toBeDefined()

      // Ketik 15 karakter
      await textarea.setValue('Halo pelanggan')
      expect(counter.text()).toBe('14/1000')
      expect(sendBtn.attributes('disabled')).toBeUndefined()

      // Kirim via tombol
      await sendBtn.trigger('click')
      expect(wrapper.emitted('sendMessage')).toBeTruthy()
      expect(wrapper.emitted('sendMessage')?.[0]).toEqual([{ message_text: 'Halo pelanggan' }])

      // Teks otomatis tereset
      expect(counter.text()).toBe('0/1000')
    })

    it('dapat membuka menu respon cepat via tombol Pesan Cepat dan menyisipkan teks template', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockThread, messages: [] },
      })

      const cannedTrigger = wrapper.find('button.btn-canned')
      expect(cannedTrigger.exists()).toBe(true)
      expect(wrapper.findComponent(AdminCannedResponseMenu).exists()).toBe(false)

      await cannedTrigger.trigger('click')
      expect(wrapper.findComponent(AdminCannedResponseMenu).exists()).toBe(true)

      // Pilih template salam pembuka
      const greetingBtn = wrapper.find('button[data-key="greeting"]')
      await greetingBtn.trigger('click')

      // Menu tertutup dan textarea terisi
      expect(wrapper.findComponent(AdminCannedResponseMenu).exists()).toBe(false)
      const textarea = wrapper.find('textarea.composer-textarea')
      expect((textarea.element as HTMLTextAreaElement).value).toContain(
        'Halo! Ada yang bisa kami bantu',
      )
    })
  })
})
