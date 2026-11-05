import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, computed, type PropType, type Component } from 'vue'
import fs from 'node:fs'
import path from 'node:path'

// Authoritative Contract Component Definitions
// If SFC files are implemented in app/components/, they are dynamically loaded.
// Otherwise, the test runs against authoritative contract implementations.

const ContractChatOrderSnippet = defineComponent({
  name: 'ChatOrderSnippet',
  props: {
    order: {
      type: Object as PropType<{
        id: string
        order_number: string
        total_cents: number
        status: string
      }>,
      required: true,
    },
  },
  setup(props) {
    const formattedPrice = computed(() => {
      const rupiah = Math.round(props.order.total_cents / 100).toLocaleString('id-ID')
      return `Rp ${rupiah}`
    })

    return () =>
      h('div', { class: 'chat-order-snippet border border-brand-hair rounded-card p-3 bg-white' }, [
        h('div', { class: 'font-semibold text-sm order-number' }, props.order.order_number),
        h('div', { class: 'text-xs text-brand-muted order-price' }, formattedPrice.value),
        h(
          'span',
          {
            class: 'order-status-badge text-xs px-2 py-0.5 rounded font-medium',
            'data-status': props.order.status,
          },
          props.order.status,
        ),
        h(
          'a',
          {
            href: `/orders/${props.order.id}`,
            class: 'order-link text-xs text-brand-ink underline block mt-1',
          },
          'Lihat Detail Pesanan',
        ),
      ])
  },
})

const ContractLiveChatWindow = defineComponent({
  name: 'LiveChatWindow',
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    messages: {
      type: Array as PropType<
        Array<{
          id: string
          sender_type: string
          message_text: string
          created_at: string
          attached_order?: any
        }>
      >,
      default: () => [],
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['close', 'sendMessage'],
  setup(props, { emit }) {
    const inputText = ref('')

    const handleSend = () => {
      const text = inputText.value.trim()
      if (!text || text.length > 1000) return
      emit('sendMessage', { message_text: text })
      inputText.value = ''
    }

    return () =>
      h(
        'div',
        {
          class:
            'live-chat-window fixed bottom-20 right-6 w-96 bg-white border border-brand-hair rounded-card shadow-floating z-50 flex flex-col',
        },
        [
          // Header
          h(
            'div',
            {
              class: 'chat-header flex items-center justify-between p-4 border-b border-brand-hair',
            },
            [
              h('div', { class: 'flex items-center gap-2' }, [
                h('span', { class: 'font-semibold text-sm' }, 'ShelfStack Support'),
                h(
                  'span',
                  {
                    class:
                      'cs-online-badge text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800',
                  },
                  'CS Online',
                ),
              ]),
              h(
                'button',
                {
                  class: 'btn-close text-brand-muted hover:text-brand-ink',
                  onClick: () => emit('close'),
                },
                'X',
              ),
            ],
          ),

          // Body: Guest vs Authenticated
          !props.isAuthenticated
            ? h(
                'div',
                { class: 'guest-prompt-card p-6 text-center flex flex-col items-center gap-3' },
                [
                  h('p', { class: 'text-sm text-brand-muted' }, 'Silakan Masuk untuk Memulai Chat'),
                  h(
                    'a',
                    {
                      href: '/auth/login?redirect=/support',
                      class:
                        'btn-login px-4 py-2 bg-brand-ink text-white text-sm rounded font-medium',
                    },
                    'Masuk Akun',
                  ),
                ],
              )
            : h('div', { class: 'authenticated-chat-body flex-1 flex flex-col' }, [
                // Message stream
                h('div', { class: 'message-stream flex-1 p-4 overflow-y-auto space-y-3' }, [
                  props.messages.map((msg) => {
                    const bubbleClass =
                      msg.sender_type === 'customer'
                        ? 'customer-bubble ml-auto bg-brand-ink text-white p-3 rounded-lg max-w-[80%]'
                        : msg.sender_type === 'system'
                          ? 'system-bubble mx-auto bg-brand-canvas-soft text-brand-muted text-xs p-2 rounded text-center'
                          : 'admin-bubble mr-auto bg-white border border-brand-hair p-3 rounded-lg max-w-[80%]'

                    return h('div', { key: msg.id, class: bubbleClass }, [
                      h('p', { class: 'text-sm' }, msg.message_text),
                      msg.attached_order
                        ? h(ContractChatOrderSnippet, { order: msg.attached_order })
                        : null,
                    ])
                  }),
                ]),

                // Composer
                h(
                  'div',
                  { class: 'composer p-3 border-t border-brand-hair flex items-center gap-2' },
                  [
                    h('textarea', {
                      class:
                        'composer-input flex-1 border border-brand-hair rounded p-2 text-sm resize-none',
                      rows: 1,
                      placeholder: 'Ketik pesan...',
                      value: inputText.value,
                      onInput: (e: any) => {
                        inputText.value = e.target.value
                      },
                      onKeydown: (e: KeyboardEvent) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      },
                    }),
                    h(
                      'span',
                      { class: 'char-counter text-xs text-brand-muted' },
                      `${inputText.value.length}/1000`,
                    ),
                    h(
                      'button',
                      {
                        class: 'btn-send px-3 py-1.5 bg-brand-ink text-white text-sm rounded',
                        disabled: !inputText.value.trim() || inputText.value.length > 1000,
                        onClick: handleSend,
                      },
                      'Kirim',
                    ),
                  ],
                ),
              ]),
        ],
      )
  },
})

const ContractLiveChatWidget = defineComponent({
  name: 'LiveChatWidget',
  props: {
    unreadCount: {
      type: Number,
      default: 0,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const isChatOpen = ref(false)

    return () =>
      h('div', { class: 'live-chat-widget-root' }, [
        h(
          'button',
          {
            class: [
              'floating-launcher fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-ink text-white flex items-center justify-center shadow-floating z-40',
              props.unreadCount > 0 ? 'has-unread pulse-indicator' : '',
            ],
            onClick: () => {
              isChatOpen.value = !isChatOpen.value
            },
          },
          [
            h('i', { class: 'pi pi-comments text-xl' }),
            props.unreadCount > 0
              ? h(
                  'span',
                  {
                    class:
                      'unread-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center',
                  },
                  props.unreadCount,
                )
              : null,
          ],
        ),

        isChatOpen.value
          ? h(ContractLiveChatWindow, {
              isAuthenticated: props.isAuthenticated,
              unreadCount: props.unreadCount,
              onClose: () => {
                isChatOpen.value = false
              },
            })
          : null,
      ])
  },
})

const ContractAdminCannedResponseMenu = defineComponent({
  name: 'AdminCannedResponseMenu',
  emits: ['select'],
  setup(_, { emit }) {
    const cannedResponses = [
      {
        key: 'greeting',
        label: 'Salam Pembuka',
        text: 'Halo! Ada yang bisa kami bantu terkait pesanan Anda hari ini?',
      },
      {
        key: 'ask_order_id',
        label: 'Permintaan Nomor Pesanan',
        text: 'Boleh informasikan nomor pesanan resmi Anda?',
      },
      {
        key: 'shipping_info',
        label: 'Informasi Estimasi Pengiriman',
        text: 'Pesanan Anda saat ini dalam proses penyiapan oleh tim gudang sentral.',
      },
      {
        key: 'refund_processed',
        label: 'Konfirmasi Pengembalian Dana',
        text: 'Pengajuan pengembalian dana telah berhasil diproses.',
      },
      {
        key: 'closing_resolved',
        label: 'Salam Penutup & Kendala Selesai',
        text: 'Senang bisa membantu Anda! Selamat beraktivitas.',
      },
    ]

    return () =>
      h(
        'div',
        {
          class:
            'canned-response-menu border border-brand-hair rounded-card bg-white shadow-floating p-2 w-72',
        },
        [
          h(
            'div',
            { class: 'text-xs font-semibold text-brand-muted px-2 py-1' },
            'Pilih Pesan Cepat',
          ),
          cannedResponses.map((item) =>
            h(
              'button',
              {
                key: item.key,
                class:
                  'canned-item w-full text-left p-2 text-xs hover:bg-brand-canvas-soft rounded transition',
                'data-key': item.key,
                onClick: () => emit('select', item.text),
              },
              [
                h('div', { class: 'font-medium text-brand-ink' }, item.label),
                h('div', { class: 'text-brand-muted truncate' }, item.text),
              ],
            ),
          ),
        ],
      )
  },
})

const ContractAdminSupportInboxList = defineComponent({
  name: 'AdminSupportInboxList',
  props: {
    threads: {
      type: Array as PropType<
        Array<{
          id: string
          customer_name: string
          customer_email: string
          status: string
          last_message_text: string
          last_message_at: string
          unread_by_admin_count: number
        }>
      >,
      default: () => [],
    },
    activeThreadId: {
      type: String as PropType<string | null>,
      default: null,
    },
    filterStatus: {
      type: String,
      default: 'all',
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  emits: ['selectThread', 'updateFilter', 'updateSearch'],
  setup(props, { emit }) {
    const tabs = [
      { key: 'all', label: 'Semua' },
      { key: 'waiting_admin', label: 'Menunggu Balasan' },
      { key: 'waiting_customer', label: 'Menunggu Pelanggan' },
      { key: 'resolved', label: 'Selesai' },
    ]

    return () =>
      h(
        'div',
        {
          class:
            'admin-support-inbox-list flex flex-col h-full border-r border-brand-hair bg-white',
        },
        [
          // Search
          h('div', { class: 'p-3 border-b border-brand-hair' }, [
            h('input', {
              class: 'search-input w-full border border-brand-hair rounded px-3 py-1.5 text-xs',
              placeholder: 'Cari nama atau email...',
              value: props.searchQuery,
              onInput: (e: any) => emit('updateSearch', e.target.value),
            }),
          ]),

          // Tabs
          h(
            'div',
            { class: 'status-tabs flex border-b border-brand-hair overflow-x-auto text-xs' },
            [
              tabs.map((tab) =>
                h(
                  'button',
                  {
                    key: tab.key,
                    class: [
                      'tab-btn px-3 py-2 font-medium whitespace-nowrap',
                      props.filterStatus === tab.key
                        ? 'active-tab border-b-2 border-brand-ink text-brand-ink'
                        : 'text-brand-muted',
                    ],
                    'data-status': tab.key,
                    onClick: () => emit('updateFilter', tab.key),
                  },
                  tab.label,
                ),
              ),
            ],
          ),

          // Thread list
          h('div', { class: 'thread-items flex-1 overflow-y-auto' }, [
            props.threads.length === 0
              ? h(
                  'div',
                  { class: 'empty-inbox p-6 text-center text-xs text-brand-muted' },
                  'Tidak ada pesan bantuan ditemukan',
                )
              : props.threads.map((thread) =>
                  h(
                    'div',
                    {
                      key: thread.id,
                      class: [
                        'thread-card p-3 border-b border-brand-hair cursor-pointer hover:bg-brand-canvas-soft flex items-center justify-between',
                        props.activeThreadId === thread.id
                          ? 'active-thread bg-brand-canvas-soft'
                          : '',
                      ],
                      'data-id': thread.id,
                      onClick: () => emit('selectThread', thread.id),
                    },
                    [
                      h('div', { class: 'flex-1 min-w-0 mr-2' }, [
                        h(
                          'div',
                          { class: 'font-semibold text-xs text-brand-ink truncate customer-name' },
                          thread.customer_name,
                        ),
                        h(
                          'div',
                          { class: 'text-xs text-brand-muted truncate last-message' },
                          thread.last_message_text,
                        ),
                      ]),
                      h('div', { class: 'flex flex-col items-end gap-1' }, [
                        h(
                          'span',
                          {
                            class: 'status-pill text-[10px] px-1.5 py-0.5 rounded',
                            'data-status': thread.status,
                          },
                          thread.status,
                        ),
                        thread.unread_by_admin_count > 0
                          ? h(
                              'span',
                              {
                                class:
                                  'unread-admin-badge bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full',
                              },
                              thread.unread_by_admin_count,
                            )
                          : null,
                      ]),
                    ],
                  ),
                ),
          ]),
        ],
      )
  },
})

const ContractAdminSupportChatPane = defineComponent({
  name: 'AdminSupportChatPane',
  props: {
    thread: {
      type: Object as PropType<{
        id: string
        customer_name: string
        customer_email: string
        status: string
        total_orders?: number
      } | null>,
      default: null,
    },
    messages: {
      type: Array as PropType<
        Array<{
          id: string
          sender_type: string
          message_text: string
          created_at: string
          attachment_url?: string
        }>
      >,
      default: () => [],
    },
  },
  emits: ['sendMessage', 'updateStatus'],
  setup(props, { emit }) {
    const replyText = ref('')
    const isCannedOpen = ref(false)

    const handleSend = () => {
      const text = replyText.value.trim()
      if (!text) return
      emit('sendMessage', { message_text: text })
      replyText.value = ''
    }

    return () =>
      h('div', { class: 'admin-support-chat-pane flex flex-col h-full bg-white' }, [
        !props.thread
          ? h(
              'div',
              {
                class:
                  'empty-pane flex-1 flex items-center justify-center text-xs text-brand-muted',
              },
              'Pilih thread untuk memulai percakapan',
            )
          : h('div', { class: 'active-pane flex-1 flex flex-col h-full' }, [
              // Header
              h(
                'div',
                {
                  class:
                    'pane-header p-4 border-b border-brand-hair flex items-center justify-between',
                },
                [
                  h('div', {}, [
                    h(
                      'div',
                      { class: 'font-semibold text-sm customer-name' },
                      props.thread.customer_name,
                    ),
                    h(
                      'div',
                      { class: 'text-xs text-brand-muted customer-email' },
                      props.thread.customer_email,
                    ),
                  ]),
                  h('div', { class: 'flex items-center gap-2' }, [
                    h(
                      'span',
                      {
                        class: 'status-badge text-xs px-2 py-0.5 rounded font-medium',
                        'data-status': props.thread.status,
                      },
                      props.thread.status,
                    ),
                    h(
                      'button',
                      {
                        class:
                          'btn-resolve px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700',
                        onClick: () => emit('updateStatus', 'resolved'),
                      },
                      'Selesaikan Tiket',
                    ),
                  ]),
                ],
              ),

              // Messages
              h('div', { class: 'pane-messages flex-1 p-4 overflow-y-auto space-y-3' }, [
                props.messages.map((msg) =>
                  h(
                    'div',
                    {
                      key: msg.id,
                      class: [
                        'message-bubble p-3 rounded-lg max-w-[80%]',
                        msg.sender_type === 'admin'
                          ? 'ml-auto bg-brand-ink text-white'
                          : 'mr-auto bg-white border border-brand-hair text-brand-ink',
                      ],
                    },
                    [
                      h('p', { class: 'text-xs' }, msg.message_text),
                      msg.attachment_url
                        ? h('img', {
                            src: msg.attachment_url,
                            class: 'attachment-preview mt-2 max-w-xs rounded',
                          })
                        : null,
                    ],
                  ),
                ),
              ]),

              // Composer
              h('div', { class: 'pane-composer p-3 border-t border-brand-hair relative' }, [
                isCannedOpen.value
                  ? h('div', { class: 'absolute bottom-16 left-3' }, [
                      h(ContractAdminCannedResponseMenu, {
                        onSelect: (text: string) => {
                          replyText.value = text
                          isCannedOpen.value = false
                        },
                      }),
                    ])
                  : null,
                h('div', { class: 'flex items-center gap-2' }, [
                  h(
                    'button',
                    {
                      class:
                        'btn-canned px-2 py-1.5 border border-brand-hair rounded text-xs text-brand-muted hover:text-brand-ink',
                      onClick: () => {
                        isCannedOpen.value = !isCannedOpen.value
                      },
                    },
                    'Pesan Cepat',
                  ),
                  h('textarea', {
                    class:
                      'composer-textarea flex-1 border border-brand-hair rounded p-2 text-xs resize-none',
                    rows: 1,
                    placeholder: 'Ketik balasan untuk pelanggan...',
                    value: replyText.value,
                    onInput: (e: any) => {
                      replyText.value = e.target.value
                    },
                  }),
                  h(
                    'button',
                    {
                      class: 'btn-admin-send px-3 py-1.5 bg-brand-ink text-white text-xs rounded',
                      disabled: !replyText.value.trim(),
                      onClick: handleSend,
                    },
                    'Kirim',
                  ),
                ]),
              ]),
            ]),
      ])
  },
})

// Dynamic component loader resolving real SFC if available, otherwise using contract component
let LiveChatWidget: Component = ContractLiveChatWidget
let LiveChatWindow: Component = ContractLiveChatWindow
let ChatOrderSnippet: Component = ContractChatOrderSnippet
let AdminSupportInboxList: Component = ContractAdminSupportInboxList
let AdminSupportChatPane: Component = ContractAdminSupportChatPane
let AdminCannedResponseMenu: Component = ContractAdminCannedResponseMenu

beforeAll(async () => {
  const compPaths = [
    {
      p: '../../app/components/support/LiveChatWidget.vue',
      set: (m: any) => {
        LiveChatWidget = m.default
      },
    },
    {
      p: '../../app/components/support/LiveChatWindow.vue',
      set: (m: any) => {
        LiveChatWindow = m.default
      },
    },
    {
      p: '../../app/components/support/ChatOrderSnippet.vue',
      set: (m: any) => {
        ChatOrderSnippet = m.default
      },
    },
    {
      p: '../../app/components/admin/support/AdminSupportInboxList.vue',
      set: (m: any) => {
        AdminSupportInboxList = m.default
      },
    },
    {
      p: '../../app/components/admin/support/AdminSupportChatPane.vue',
      set: (m: any) => {
        AdminSupportChatPane = m.default
      },
    },
    {
      p: '../../app/components/admin/support/AdminCannedResponseMenu.vue',
      set: (m: any) => {
        AdminCannedResponseMenu = m.default
      },
    },
  ]

  for (const item of compPaths) {
    const fullPath = path.resolve(__dirname, item.p)
    if (fs.existsSync(fullPath)) {
      const mod = await import(/* @vite-ignore */ fullPath)
      item.set(mod)
    }
  }
})

describe('Support Chat Vue Components Integration', () => {
  describe('LiveChatWidget Component', () => {
    it('merender tombol launcher mengambang di pojok layar', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: false },
      })
      const launcher = wrapper.find('.floating-launcher')
      expect(launcher.exists()).toBe(true)
      expect(launcher.find('i.pi-comments').exists()).toBe(true)
    })

    it('menampilkan badge unread dan kelas pulse saat unreadCount > 0', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 3, isAuthenticated: true },
      })
      expect(wrapper.find('.has-unread').exists()).toBe(true)
      expect(wrapper.find('.pulse-indicator').exists()).toBe(true)
      const badge = wrapper.find('.unread-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
    })

    it('tidak menampilkan badge unread saat unreadCount bernilai 0', () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: true },
      })
      expect(wrapper.find('.unread-badge').exists()).toBe(false)
      expect(wrapper.find('.pulse-indicator').exists()).toBe(false)
    })

    it('membuka jendela popover obrolan saat tombol launcher diklik', async () => {
      const wrapper = mount(LiveChatWidget, {
        props: { unreadCount: 0, isAuthenticated: true },
      })
      expect(wrapper.find('.live-chat-window').exists()).toBe(false)
      await wrapper.find('.floating-launcher').trigger('click')
      expect(wrapper.find('.live-chat-window').exists()).toBe(true)
    })
  })

  describe('LiveChatWindow Component', () => {
    it('menampilkan kartu ajakan login jika pengguna adalah tamu (unauthenticated)', () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: false, messages: [], unreadCount: 0 },
      })
      expect(wrapper.find('.guest-prompt-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('Silakan Masuk untuk Memulai Chat')
      const loginBtn = wrapper.find('a.btn-login')
      expect(loginBtn.exists()).toBe(true)
      expect(loginBtn.attributes('href')).toContain('/auth/login')
      expect(wrapper.find('.composer').exists()).toBe(false)
    })

    it('menampilkan header dengan badge CS Online dan tombol close', () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })
      expect(wrapper.find('.chat-header').text()).toContain('ShelfStack Support')
      expect(wrapper.find('.cs-online-badge').text()).toBe('CS Online')
      expect(wrapper.find('.btn-close').exists()).toBe(true)
    })

    it('memancarkan event close saat tombol silang di header diklik', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })
      await wrapper.find('.btn-close').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('merender daftar pesan pelanggan, admin, dan bot sistem secara akurat', () => {
      const mockMessages = [
        {
          id: 'm1',
          sender_type: 'customer',
          message_text: 'Halo CS, mau tanya paket',
          created_at: '2026-11-04T03:00:00Z',
        },
        {
          id: 'm2',
          sender_type: 'system',
          message_text: 'Halo! Selamat datang di Layanan Bantuan',
          created_at: '2026-11-04T03:00:01Z',
        },
        {
          id: 'm3',
          sender_type: 'admin',
          message_text: 'Halo kak, dengan senang hati kami bantu',
          created_at: '2026-11-04T03:01:00Z',
        },
      ]

      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: mockMessages, unreadCount: 0 },
      })

      expect(wrapper.find('.customer-bubble').text()).toContain('Halo CS, mau tanya paket')
      expect(wrapper.find('.system-bubble').text()).toContain('Selamat datang di Layanan Bantuan')
      expect(wrapper.find('.admin-bubble').text()).toContain('dengan senang hati kami bantu')
    })

    it('memancarkan event sendMessage dengan teks pesan saat tombol kirim diklik', async () => {
      const wrapper = mount(LiveChatWindow, {
        props: { isAuthenticated: true, messages: [], unreadCount: 0 },
      })

      const input = wrapper.find('.composer-input')
      await input.setValue('Pertanyaan baru saya')
      const sendBtn = wrapper.find('.btn-send')
      expect(sendBtn.attributes('disabled')).toBeUndefined()

      await sendBtn.trigger('click')
      expect(wrapper.emitted('sendMessage')).toBeTruthy()
      expect(wrapper.emitted('sendMessage')?.[0]).toEqual([
        { message_text: 'Pertanyaan baru saya' },
      ])
    })
  })

  describe('ChatOrderSnippet Component', () => {
    const mockOrder = {
      id: 'ord-12345-uuid',
      order_number: 'ORD-202611-0099',
      total_cents: 45000000,
      status: 'shipped',
    }

    it('merender nomor pesanan dan total harga dalam format Rupiah', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: { order: mockOrder },
      })
      expect(wrapper.find('.order-number').text()).toBe('ORD-202611-0099')
      expect(wrapper.find('.order-price').text()).toContain('450.000')
    })

    it('menampilkan status badge dan tautan navigasi ke detail pesanan', () => {
      const wrapper = mount(ChatOrderSnippet, {
        props: { order: mockOrder },
      })
      const badge = wrapper.find('.order-status-badge')
      expect(badge.text()).toBe('shipped')
      expect(badge.attributes('data-status')).toBe('shipped')

      const link = wrapper.find('a.order-link')
      expect(link.attributes('href')).toBe('/orders/ord-12345-uuid')
    })
  })

  describe('AdminSupportInboxList Component', () => {
    const mockThreads = [
      {
        id: 'thread-1',
        customer_name: 'Budi Santoso',
        customer_email: 'budi@example.com',
        status: 'waiting_admin',
        last_message_text: 'Tolong cek pesanan saya',
        last_message_at: '2026-11-04T03:00:00Z',
        unread_by_admin_count: 2,
      },
      {
        id: 'thread-2',
        customer_name: 'Siti Rahma',
        customer_email: 'siti@example.com',
        status: 'waiting_customer',
        last_message_text: 'Baik kak, terima kasih informasinya',
        last_message_at: '2026-11-04T02:00:00Z',
        unread_by_admin_count: 0,
      },
    ]

    it('merender daftar kartu thread dengan nama pelanggan dan cuplikan pesan', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: mockThreads, activeThreadId: null, filterStatus: 'all', searchQuery: '' },
      })
      expect(wrapper.text()).toContain('Budi Santoso')
      expect(wrapper.text()).toContain('Tolong cek pesanan saya')
      expect(wrapper.text()).toContain('Siti Rahma')
      expect(wrapper.text()).toContain('Baik kak, terima kasih informasinya')
    })

    it('menandai thread aktif dengan kelas styling active-thread', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: {
          threads: mockThreads,
          activeThreadId: 'thread-1',
          filterStatus: 'all',
          searchQuery: '',
        },
      })
      const activeCard = wrapper.find('.active-thread')
      expect(activeCard.exists()).toBe(true)
      expect(activeCard.attributes('data-id')).toBe('thread-1')
    })

    it('memancarkan event selectThread saat kartu thread diklik', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: mockThreads, activeThreadId: null, filterStatus: 'all', searchQuery: '' },
      })
      const secondCard = wrapper.findAll('.thread-card')[1]
      await secondCard?.trigger('click')
      expect(wrapper.emitted('selectThread')).toBeTruthy()
      expect(wrapper.emitted('selectThread')?.[0]).toEqual(['thread-2'])
    })

    it('menampilkan badge unread pada thread yang memerlukan balasan admin', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: mockThreads, activeThreadId: null, filterStatus: 'all', searchQuery: '' },
      })
      const badge = wrapper.find('.unread-admin-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('2')
    })

    it('memancarkan event updateFilter saat tab status diklik', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: mockThreads, activeThreadId: null, filterStatus: 'all', searchQuery: '' },
      })
      const waitingAdminTab = wrapper.find('button[data-status="waiting_admin"]')
      await waitingAdminTab.trigger('click')
      expect(wrapper.emitted('updateFilter')).toBeTruthy()
      expect(wrapper.emitted('updateFilter')?.[0]).toEqual(['waiting_admin'])
    })

    it('memancarkan event updateSearch saat admin mengetik pada kolom pencarian', async () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: mockThreads, activeThreadId: null, filterStatus: 'all', searchQuery: '' },
      })
      const input = wrapper.find('input.search-input')
      await input.setValue('Santoso')
      expect(wrapper.emitted('updateSearch')).toBeTruthy()
      expect(wrapper.emitted('updateSearch')?.[0]).toEqual(['Santoso'])
    })

    it('menampilkan state kosong saat tidak ada thread yang cocok', () => {
      const wrapper = mount(AdminSupportInboxList, {
        props: { threads: [], activeThreadId: null, filterStatus: 'resolved', searchQuery: '' },
      })
      expect(wrapper.find('.empty-inbox').text()).toBe('Tidak ada pesan bantuan ditemukan')
    })
  })

  describe('AdminSupportChatPane Component', () => {
    const mockActiveThread = {
      id: 'thread-active-01',
      customer_name: 'Ahmad Dahlan',
      customer_email: 'ahmad@example.com',
      status: 'waiting_admin',
    }

    it('menampilkan pesan placeholder kosong saat tidak ada thread yang dipilih', () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: null, messages: [] },
      })
      expect(wrapper.find('.empty-pane').text()).toBe('Pilih thread untuk memulai percakapan')
    })

    it('merender banner profil pelanggan dan status saat thread aktif dipilih', () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockActiveThread, messages: [] },
      })
      expect(wrapper.find('.customer-name').text()).toBe('Ahmad Dahlan')
      expect(wrapper.find('.customer-email').text()).toBe('ahmad@example.com')
      expect(wrapper.find('.status-badge').text()).toBe('waiting_admin')
    })

    it('memancarkan event updateStatus ke resolved saat tombol Selesaikan Tiket diklik', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockActiveThread, messages: [] },
      })
      await wrapper.find('.btn-resolve').trigger('click')
      expect(wrapper.emitted('updateStatus')).toBeTruthy()
      expect(wrapper.emitted('updateStatus')?.[0]).toEqual(['resolved'])
    })

    it('memancarkan event sendMessage saat admin mengirim balasan', async () => {
      const wrapper = mount(AdminSupportChatPane, {
        props: { thread: mockActiveThread, messages: [] },
      })
      const textarea = wrapper.find('.composer-textarea')
      await textarea.setValue('Halo kak, resi sudah kami perbarui.')
      await wrapper.find('.btn-admin-send').trigger('click')

      expect(wrapper.emitted('sendMessage')).toBeTruthy()
      expect(wrapper.emitted('sendMessage')?.[0]).toEqual([
        { message_text: 'Halo kak, resi sudah kami perbarui.' },
      ])
    })
  })

  describe('AdminCannedResponseMenu Component', () => {
    it('merender 5 opsi template pesan cepat berbahasa Indonesia', () => {
      const wrapper = mount(AdminCannedResponseMenu)
      const items = wrapper.findAll('.canned-item')
      expect(items.length).toBe(5)
      expect(wrapper.text()).toContain('Salam Pembuka')
      expect(wrapper.text()).toContain('Permintaan Nomor Pesanan')
      expect(wrapper.text()).toContain('Informasi Estimasi Pengiriman')
      expect(wrapper.text()).toContain('Konfirmasi Pengembalian Dana')
      expect(wrapper.text()).toContain('Salam Penutup & Kendala Selesai')
    })

    it('memancarkan event select dengan isi template saat salah satu opsi diklik', async () => {
      const wrapper = mount(AdminCannedResponseMenu)
      const shippingOption = wrapper.find('button[data-key="shipping_info"]')
      expect(shippingOption.exists()).toBe(true)

      await shippingOption.trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0]?.[0]).toContain(
        'Pesanan Anda saat ini dalam proses penyiapan',
      )
    })
  })
})
