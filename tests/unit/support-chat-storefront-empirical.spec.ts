import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LiveChatWidget from '../../app/components/support/LiveChatWidget.vue'
import LiveChatWindow from '../../app/components/support/LiveChatWindow.vue'
import ChatOrderSnippet from '../../app/components/support/ChatOrderSnippet.vue'

describe('Empirical Verification: Storefront Support Chat Components', () => {
  describe('1. LiveChatWidget.vue DOM & Event Contracts', () => {
    it('merender tombol launcher mengambang dengan icon pi-comments saat tertutup', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: false },
      })

      const launcher = wrapper.find('button.floating-launcher')
      expect(launcher.exists()).toBe(true)
      expect(launcher.classes()).toContain('fixed')
      expect(launcher.classes()).toContain('bottom-6')
      expect(launcher.classes()).toContain('right-6')
      expect(launcher.attributes('aria-expanded')).toBe('false')
      expect(launcher.attributes('aria-label')).toBe('Buka Live Chat Bantuan')

      const icon = launcher.find('i.pi')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('pi-comments')
      expect(icon.classes()).not.toContain('pi-times')
    })

    it('menampilkan badge unread dan pulse animation saat unreadCount > 0', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 5, isAuthenticated: true },
      })

      const launcher = wrapper.find('button.floating-launcher')
      expect(launcher.classes()).toContain('has-unread')
      expect(launcher.classes()).toContain('pulse-indicator')

      const badge = wrapper.find('.unread-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('5')

      const pulseRing = launcher.find('.animate-ping')
      expect(pulseRing.exists()).toBe(true)
    })

    it('memformat badge menjadi "99+" saat unreadCount melebihi 99', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 120, isAuthenticated: true },
      })

      const badge = wrapper.find('.unread-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('99+')
    })

    it('menyembunyikan badge dan pulse animation saat unreadCount == 0', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: true },
      })

      const launcher = wrapper.find('button.floating-launcher')
      expect(launcher.classes()).not.toContain('has-unread')
      expect(launcher.classes()).not.toContain('pulse-indicator')
      expect(wrapper.find('.unread-badge').exists()).toBe(false)
      expect(launcher.find('.animate-ping').exists()).toBe(false)
    })

    it('melakukan toggle buka dan tutup jendela chat saat launcher diklik', async () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: true },
      })

      const launcher = wrapper.find('button.floating-launcher')

      // Awalnya jendela chat belum terbuka
      expect(wrapper.findComponent(LiveChatWindow).exists()).toBe(false)
      expect(launcher.attributes('aria-expanded')).toBe('false')

      // Klik untuk membuka
      await launcher.trigger('click')
      expect(wrapper.findComponent(LiveChatWindow).exists()).toBe(true)
      expect(launcher.attributes('aria-expanded')).toBe('true')
      expect(launcher.attributes('aria-label')).toBe('Tutup Live Chat Bantuan')
      expect(launcher.find('i.pi').classes()).toContain('pi-times')

      // Klik lagi untuk menutup
      await launcher.trigger('click')
      expect(wrapper.findComponent(LiveChatWindow).exists()).toBe(false)
      expect(launcher.attributes('aria-expanded')).toBe('false')
      expect(launcher.find('i.pi').classes()).toContain('pi-comments')
    })

    it('menutup jendela chat ketika LiveChatWindow memancarkan event close', async () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: true },
      })

      // Buka chat
      await wrapper.find('button.floating-launcher').trigger('click')
      const windowComp = wrapper.findComponent(LiveChatWindow)
      expect(windowComp.exists()).toBe(true)

      // Emit event close dari window
      await windowComp.vm.$emit('close')
      expect(wrapper.findComponent(LiveChatWindow).exists()).toBe(false)
    })
  })

  describe('2. LiveChatWindow.vue Gating, DOM & Stream Contracts', () => {
    it('menampilkan guest prompt card dan link /auth/login saat unauthenticated, serta menyembunyikan composer', () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: false, messages: [], unreadCount: 0 },
      })

      // Header tetap ada dengan CS Online badge
      expect(wrapper.find('.chat-header').text()).toContain('ShelfStack Support')
      expect(wrapper.find('.cs-online-badge').text()).toContain('CS Online')

      // Guest prompt card
      const promptCard = wrapper.find('.guest-prompt-card')
      expect(promptCard.exists()).toBe(true)
      expect(promptCard.text()).toContain('Silakan Masuk untuk Memulai Chat')

      // Tautan login
      const loginLink = promptCard.find('a.btn-login')
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.attributes('href')).toContain('/auth/login')

      // Composer wajib absen sama sekali
      expect(wrapper.find('.composer').exists()).toBe(false)
      expect(wrapper.find('.authenticated-chat-body').exists()).toBe(false)
    })

    it('menampilkan CS Online header, pesan selamat datang kosong, dan composer saat authenticated', () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      // Header
      expect(wrapper.find('.chat-header').exists()).toBe(true)
      expect(wrapper.find('.cs-online-badge').text()).toContain('CS Online')

      // Authenticated body
      expect(wrapper.find('.authenticated-chat-body').exists()).toBe(true)
      expect(wrapper.find('.guest-prompt-card').exists()).toBe(false)

      // Pesan kosong
      expect(wrapper.find('.message-stream').text()).toContain('Belum ada pesan. Mulai percakapan')

      // Composer elements
      const composer = wrapper.find('.composer')
      expect(composer.exists()).toBe(true)
      expect(composer.find('input[type="file"]').exists()).toBe(true)
      expect(composer.find('textarea.composer-input').exists()).toBe(true)
      expect(composer.find('.char-counter').text()).toBe('0/1000')
      expect(composer.find('button.btn-send').exists()).toBe(true)
    })

    it('memancarkan event close saat tombol silang di header diklik', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const closeBtn = wrapper.find('button.btn-close')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')?.length).toBe(1)
    })

    it('merender stream bubble untuk customer, admin, dan system secara terstruktur', () => {
      const mockMessages = [
        {
          id: 'msg-sys-1',
          sender_type: 'system' as const,
          message_text: 'Selamat datang di Layanan Dukungan ShelfStack!',
          created_at: '2026-11-04T03:00:00Z',
        },
        {
          id: 'msg-cust-1',
          sender_type: 'customer' as const,
          message_text: 'Halo CS, apakah pesanan saya sudah dikirim?',
          created_at: '2026-11-04T03:01:00Z',
        },
        {
          id: 'msg-adm-1',
          sender_type: 'admin' as const,
          message_text: 'Halo kak! Kami bantu lacak pengiriman pesanan Anda.',
          created_at: '2026-11-04T03:02:00Z',
        },
      ]

      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: mockMessages, unreadCount: 0 },
      })

      // System bubble (center pill)
      const systemBubble = wrapper.find('.system-bubble')
      expect(systemBubble.exists()).toBe(true)
      expect(systemBubble.text()).toBe('Selamat datang di Layanan Dukungan ShelfStack!')

      // Customer bubble (right aligned, bg-brand-ink, text-white)
      const customerBubble = wrapper.find('.customer-bubble')
      expect(customerBubble.exists()).toBe(true)
      expect(customerBubble.text()).toContain('Halo CS, apakah pesanan saya sudah dikirim?')
      expect(customerBubble.classes()).toContain('ml-auto')

      // Admin bubble (left aligned, bg-white, text-brand-ink)
      const adminBubble = wrapper.find('.admin-bubble')
      expect(adminBubble.exists()).toBe(true)
      expect(adminBubble.text()).toContain('Halo kak! Kami bantu lacak pengiriman pesanan Anda.')
      expect(adminBubble.classes()).toContain('mr-auto')
    })

    it('merender ChatOrderSnippet di dalam bubble chat saat ada attached_order', () => {
      const mockMessages = [
        {
          id: 'msg-order-1',
          sender_type: 'customer' as const,
          message_text: 'Mohon dicek pesanan ini',
          created_at: '2026-11-04T03:00:00Z',
          attached_order: {
            id: 'ord-8877-uuid',
            order_number: 'ORD-202611-8877',
            total_cents: 12500000,
            status: 'paid',
          },
        },
      ]

      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: mockMessages, unreadCount: 0 },
      })

      const orderSnippet = wrapper.findComponent(ChatOrderSnippet)
      expect(orderSnippet.exists()).toBe(true)
      expect(orderSnippet.text()).toContain('ORD-202611-8877')
      expect(orderSnippet.text()).toContain('125.000')
      expect(orderSnippet.find('.order-status-badge').attributes('data-status')).toBe('paid')
    })

    it('merender gambar lampiran dan membuka lightbox modal saat diklik', async () => {
      const mockMessages = [
        {
          id: 'msg-img-1',
          sender_type: 'customer' as const,
          message_text: 'Ini bukti kerusakan barang',
          attachment_url: 'https://example.com/damaged-box.png',
          created_at: '2026-11-04T03:00:00Z',
        },
      ]

      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: mockMessages, unreadCount: 0 },
      })

      const img = wrapper.find('.customer-bubble img.attachment-preview')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/damaged-box.png')

      // Lightbox awalnya tertutup
      expect(wrapper.find('.fixed.inset-0.z-50').exists()).toBe(false)

      // Klik gambar untuk membuka lightbox
      await img.trigger('click')
      const lightbox = wrapper.find('.fixed.inset-0.z-50')
      expect(lightbox.exists()).toBe(true)
      expect(lightbox.find('img').attributes('src')).toBe('https://example.com/damaged-box.png')

      // Tutup lightbox via klik tombol close
      await lightbox.find('button[aria-label="Tutup pratinjau"]').trigger('click')
      expect(wrapper.find('.fixed.inset-0.z-50').exists()).toBe(false)
    })

    it('menegakkan batas maksimal 1000 karakter pada composer textarea', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const textarea = wrapper.find('textarea.composer-input')
      expect(textarea.attributes('maxlength')).toBe('1000')

      // Set teks 500 karakter
      const text500 = 'A'.repeat(500)
      await textarea.setValue(text500)
      expect(wrapper.find('.char-counter').text()).toBe('500/1000')

      // Set teks 1000 karakter
      const text1000 = 'B'.repeat(1000)
      await textarea.setValue(text1000)
      expect(wrapper.find('.char-counter').text()).toBe('1000/1000')
      expect(wrapper.find('button.btn-send').attributes('disabled')).toBeUndefined()
    })

    it('menonaktifkan tombol kirim jika teks kosong atau hanya berisi spasi whitespace', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const sendBtn = wrapper.find('button.btn-send')
      const textarea = wrapper.find('textarea.composer-input')

      // Kosong
      expect(sendBtn.attributes('disabled')).toBeDefined()

      // Spasi saja
      await textarea.setValue('     \n\t  ')
      expect(sendBtn.attributes('disabled')).toBeDefined()

      // Teks valid
      await textarea.setValue('Halo!')
      expect(sendBtn.attributes('disabled')).toBeUndefined()
    })

    it('memancarkan event sendMessage dan mereset input saat tombol kirim diklik', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const textarea = wrapper.find('textarea.composer-input')
      await textarea.setValue('Pertanyaan dari customer')

      await wrapper.find('button.btn-send').trigger('click')

      expect(wrapper.emitted('sendMessage')).toBeTruthy()
      expect(wrapper.emitted('sendMessage')?.[0]).toEqual([
        { message_text: 'Pertanyaan dari customer' },
      ])

      // Input di-reset
      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
      expect(wrapper.find('.char-counter').text()).toBe('0/1000')
    })

    it('menolak berkas foto lampiran yang berukuran lebih dari 5MB', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('accept')).toBe('image/*')

      // Buat mock berkas sebesar 6MB (melebihi batas 5MB)
      const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'giant-photo.png', {
        type: 'image/png',
      })

      Object.defineProperty(fileInput.element, 'files', {
        value: [oversizedFile],
        writable: true,
      })

      await fileInput.trigger('change')

      expect(wrapper.text()).toContain('Ukuran berkas maksimal 5MB.')
      expect(wrapper.find('img.h-8.w-8').exists()).toBe(false)
    })
  })

  describe('3. ChatOrderSnippet.vue DOM & Data Binding Contracts', () => {
    it('merender nomor pesanan dari order_number jika tersedia', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: {
          order: {
            id: 'ord-uuid-1234',
            order_number: 'ORD-202611-9988',
            total_cents: 35000000,
            status: 'completed',
          },
        },
      })

      expect(wrapper.find('.order-number').text()).toBe('ORD-202611-9988')
    })

    it('menggunakan fallback nomor pesanan berbasis UUID saat order_number bernilai null/undefined', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: {
          order: {
            id: 'abcdef12-3456-7890-abcd-ef1234567890',
            order_number: null,
            total_cents: 20000000,
            status: 'processing',
          },
        },
      })

      expect(wrapper.find('.order-number').text()).toBe('ORD-ABCDEF12')
    })

    it('memformat total harga dari total_cents ke format mata uang Rupiah', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: {
          order: {
            id: 'ord-1',
            order_number: 'ORD-1',
            total_cents: 17500000, // Rp 175.000
            status: 'paid',
          },
        },
      })

      expect(wrapper.find('.order-price').text()).toBe('Rp 175.000')
    })

    it('merender status badge dengan atribut data-status dan styling yang sesuai untuk semua status', () => {
      const statuses = [
        { status: 'completed', expectedClass: 'bg-brand-success-tint' },
        { status: 'paid', expectedClass: 'bg-brand-accent-tint' },
        { status: 'shipped', expectedClass: 'bg-brand-accent-tint' },
        { status: 'processing', expectedClass: 'bg-brand-accent-tint' },
        { status: 'pending', expectedClass: 'bg-brand-warning-tint' },
        { status: 'cancelled', expectedClass: 'bg-brand-danger-tint' },
        { status: 'refunded', expectedClass: 'bg-brand-danger-tint' },
        { status: 'unknown_custom', expectedClass: 'bg-brand-canvas-soft' },
      ]

      for (const item of statuses) {
        const wrapper = mount(ChatOrderSnippet, {
          props: {
            order: {
              id: 'ord-status-test',
              order_number: 'ORD-TEST',
              total_cents: 10000000,
              status: item.status,
            },
          },
        })

        const badge = wrapper.find('.order-status-badge')
        expect(badge.attributes('data-status')).toBe(item.status)
        expect(badge.text()).toBe(item.status)
        expect(badge.classes()).toContain(item.expectedClass)
      }
    })

    it('merender tautan navigasi ke halaman rincian pesanan dengan href /orders/:id', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: {
          order: {
            id: 'target-order-id-999',
            order_number: 'ORD-999',
            total_cents: 5000000,
            status: 'shipped',
          },
        },
      })

      const link = wrapper.find('a.order-link')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('/orders/target-order-id-999')
      expect(link.text()).toContain('Lihat Detail Pesanan')
    })
  })
})
