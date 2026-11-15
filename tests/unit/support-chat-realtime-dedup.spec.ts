import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import fs from 'node:fs'
import path from 'node:path'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { SupportMessageItem } from '../../shared/schemas/support-chat'
import { useSupportChat } from '../../app/composables/useSupportChat'

const { mockFetch, mockChannel, mockSupabaseClient, stateStore, channelCallbacks } = vi.hoisted(
  () => {
    const stateStore = new Map<string, any>()
    const mockFetch = vi.fn()
    const channelCallbacks = {
      onCallback: null as any,
    }

    const mockChannel = {
      on: vi.fn((event: string, filter: any, callback: any) => {
        channelCallbacks.onCallback = callback
        return mockChannel
      }),
      subscribe: vi.fn(() => mockChannel),
    }

    const mockSupabaseClient = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    }

    return {
      mockFetch,
      mockChannel,
      mockSupabaseClient,
      stateStore,
      channelCallbacks,
    }
  },
)

// Mock Nuxt auto-imports via mockNuxtImport
mockNuxtImport('useState', () => <T>(key: string, init?: () => T) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init ? init() : null))
  }
  return stateStore.get(key)
})

mockNuxtImport('$fetch', () => mockFetch)
globalThis.$fetch = mockFetch as any

mockNuxtImport('useSupabaseClient', () => () => mockSupabaseClient)

const isLoggedInRef = ref(true)
const userRef = ref<{ id: string; email: string } | null>({
  id: 'cust-uuid-1',
  email: 'customer@shelfstack.atsiilaarya.me',
})
const profileRef = ref<{ id: string; full_name: string; role: 'customer' | 'admin' } | null>({
  id: 'cust-uuid-1',
  full_name: 'Customer Testing',
  role: 'customer',
})

vi.mock('~/features/auth/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: isLoggedInRef,
    user: userRef,
    profile: profileRef,
  }),
}))

describe('Challenger M3.2: Realtime Deduplication, Channel Teardown, Unread Counter & SSR Hydration Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stateStore.clear()
    channelCallbacks.onCallback = null
    isLoggedInRef.value = true
    userRef.value = { id: 'cust-uuid-1', email: 'customer@shelfstack.atsiilaarya.me' }
    profileRef.value = { id: 'cust-uuid-1', full_name: 'Customer Testing', role: 'customer' }
  })

  describe('1. Message Deduplication Invariants', () => {
    it('Scenario 1.1: REST response completes first, subsequent Realtime INSERT event with same ID is ignored', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-dedup-1'
      composable.thread.value = {
        id: threadId,
        customer_id: 'cust-uuid-1',
        status: 'open',
        last_message_text: null,
        last_message_at: null,
        unread_by_customer_count: 0,
        unread_by_admin_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Initial thread init establishes realtime subscription
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: composable.thread.value,
          messages: [],
        },
      })
      await composable.initThread()

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(`support-thread-${threadId}`)
      expect(channelCallbacks.onCallback).toBeTypeOf('function')

      const messageId = 'msg-race-001'
      const outgoingMessage: SupportMessageItem = {
        id: messageId,
        thread_id: threadId,
        sender_type: 'customer',
        sender_id: 'cust-uuid-1',
        message_text: 'Halo CS, apakah pesanan saya sudah dikirim?',
        created_at: new Date().toISOString(),
      }

      // Mock REST POST response returning the created message
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          message: outgoingMessage,
          system_message: null,
        },
      })

      // Step A: REST POST returns and appends the message
      const sendResult = await composable.sendMessage('Halo CS, apakah pesanan saya sudah dikirim?')
      expect(sendResult).toBe(true)
      expect(composable.messages.value.length).toBe(1)
      expect(composable.messages.value[0].id).toBe(messageId)

      // Step B: Realtime INSERT event arrives later with the exact same ID
      channelCallbacks.onCallback({ new: outgoingMessage })

      // Invariant Check: messages count MUST remain 1, exactly zero duplicates
      expect(composable.messages.value.length).toBe(1)
      expect(composable.messages.value.filter((m) => m.id === messageId).length).toBe(1)
    })

    it('Scenario 1.2: Realtime INSERT event arrives first, subsequent delayed REST response with same ID is ignored', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-dedup-2'
      composable.thread.value = {
        id: threadId,
        customer_id: 'cust-uuid-1',
        status: 'open',
        last_message_text: null,
        last_message_at: null,
        unread_by_customer_count: 0,
        unread_by_admin_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: composable.thread.value,
          messages: [],
        },
      })
      await composable.initThread()

      const messageId = 'msg-race-002'
      const outgoingMessage: SupportMessageItem = {
        id: messageId,
        thread_id: threadId,
        sender_type: 'customer',
        sender_id: 'cust-uuid-1',
        message_text: 'Tanya stok produk',
        created_at: new Date().toISOString(),
      }

      // Delay REST POST resolution
      let resolveRestPost: (val: any) => void
      const delayedRestPromise = new Promise((resolve) => {
        resolveRestPost = resolve
      })
      mockFetch.mockReturnValueOnce(delayedRestPromise)

      // Trigger sendMessage, which triggers REST POST (still pending)
      const sendPromise = composable.sendMessage('Tanya stok produk')
      expect(composable.messages.value.length).toBe(0)

      // Step A: Realtime event arrives BEFORE REST resolves
      channelCallbacks.onCallback({ new: outgoingMessage })
      expect(composable.messages.value.length).toBe(1)
      expect(composable.messages.value[0].id).toBe(messageId)

      // Step B: Delayed REST POST now resolves with same message
      resolveRestPost!({
        status: 'success',
        data: {
          message: outgoingMessage,
          system_message: null,
        },
      })
      await sendPromise

      // Invariant Check: messages count MUST remain 1, deduplicated against Realtime
      expect(composable.messages.value.length).toBe(1)
      expect(composable.messages.value.filter((m) => m.id === messageId).length).toBe(1)
    })

    it('Scenario 1.3: Realtime reconnect replay storm (10 identical events) pushes message exactly once', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-dedup-3'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()

      const stormMessage: SupportMessageItem = {
        id: 'msg-storm-999',
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: 'admin-uuid-1',
        message_text: 'Pesan broadcast storm',
        created_at: new Date().toISOString(),
      }

      // Simulate 10 duplicate Realtime events arriving in rapid succession
      for (let i = 0; i < 10; i++) {
        channelCallbacks.onCallback({ new: stormMessage })
      }

      // Invariant Check: Exactly 1 instance is retained
      expect(composable.messages.value.length).toBe(1)
      expect(composable.messages.value[0].id).toBe('msg-storm-999')
    })

    it('Scenario 1.4: First message System Welcome Message deduplication race between REST and Realtime', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-dedup-4'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()

      const customerMsg: SupportMessageItem = {
        id: 'cust-msg-first',
        thread_id: threadId,
        sender_type: 'customer',
        sender_id: 'cust-uuid-1',
        message_text: 'Halo pertama kali chat',
        created_at: new Date().toISOString(),
      }

      const systemMsg: SupportMessageItem = {
        id: 'sys-msg-welcome-first',
        thread_id: threadId,
        sender_type: 'system',
        sender_id: null,
        message_text: 'Halo! Terima kasih telah menghubungi layanan bantuan ShelfStack.',
        created_at: new Date().toISOString(),
      }

      // REST returns both customer message and system welcome message
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          message: customerMsg,
          system_message: systemMsg,
        },
      })

      // Send first message
      await composable.sendMessage('Halo pertama kali chat')

      expect(composable.messages.value.length).toBe(2)
      expect(composable.messages.value.map((m) => m.id)).toEqual([
        'cust-msg-first',
        'sys-msg-welcome-first',
      ])

      // Realtime delivers system welcome message as well
      channelCallbacks.onCallback({ new: systemMsg })

      // Invariant Check: No duplicate system message is created
      expect(composable.messages.value.length).toBe(2)
      expect(composable.messages.value.filter((m) => m.id === 'sys-msg-welcome-first').length).toBe(
        1,
      )
    })

    it('Scenario 1.5: Soft-deleted messages arriving via Realtime are strictly discarded', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-dedup-5'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()

      const deletedMessage: SupportMessageItem = {
        id: 'msg-deleted-1',
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: 'admin-uuid-1',
        message_text: 'Pesan ditarik admin',
        deleted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      channelCallbacks.onCallback({ new: deletedMessage })

      // Invariant Check: Deleted message is ignored
      expect(composable.messages.value.length).toBe(0)
    })
  })

  describe('2. Channel Teardown and Cleanup Invariants', () => {
    it('Scenario 2.1: Calling cleanupChannel() removes channel from Supabase client and sets channel to null', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-teardown-1'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(`support-thread-${threadId}`)
      expect(mockSupabaseClient.removeChannel).not.toHaveBeenCalled()

      // Call cleanupChannel explicitly
      composable.cleanupChannel()

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledTimes(1)
      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel)

      // Subsequent call must be idempotent (no-op)
      composable.cleanupChannel()
      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledTimes(1)
    })

    it('Scenario 2.2: User logout triggers channel teardown and clears all customer chat state', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-teardown-2'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open' },
          messages: [
            {
              id: 'm1',
              thread_id: threadId,
              sender_type: 'customer',
              message_text: 'Test',
              created_at: '',
            },
          ],
        },
      })
      await composable.initThread()

      expect(composable.thread.value).not.toBeNull()
      expect(composable.messages.value.length).toBe(1)

      // Simulate customer logout
      isLoggedInRef.value = false
      await composable.initThread() // Calling when logged out clears state

      expect(composable.thread.value).toBeNull()
      expect(composable.messages.value).toEqual([])
      expect(composable.unreadCount.value).toBe(0)
    })

    it('Scenario 2.3: Re-subscribing to a new thread cleans up previous channel first', async () => {
      const composable = useSupportChat()

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: 'thread-old', status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('support-thread-thread-old')

      // Switch to a new thread
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: 'thread-new', status: 'open' },
          messages: [],
        },
      })
      await composable.initThread()

      // Invariant Check: removeChannel was called before new channel subscription
      expect(mockSupabaseClient.removeChannel).toHaveBeenCalled()
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('support-thread-thread-new')
    })
  })

  describe('3. Unread Counter Synchronization Invariants', () => {
    it('Scenario 3.1: Admin reply increments unreadCount when chat window is CLOSED', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-unread-1'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open', unread_by_customer_count: 0 },
          messages: [],
        },
      })
      await composable.initThread()

      // Ensure window is closed
      composable.isOpen.value = false
      composable.unreadCount.value = 0

      const adminReply1: SupportMessageItem = {
        id: 'admin-msg-01',
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: 'admin-uuid-1',
        message_text: 'Halo kak, ada yang bisa dibantu?',
        created_at: new Date().toISOString(),
      }

      channelCallbacks.onCallback({ new: adminReply1 })

      // Invariant Check: unread count increments to 1
      expect(composable.unreadCount.value).toBe(1)
      expect(composable.thread.value?.unread_by_customer_count).toBe(1)

      const adminReply2: SupportMessageItem = {
        id: 'admin-msg-02',
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: 'admin-uuid-1',
        message_text: 'Boleh infokan nomor pesanan?',
        created_at: new Date().toISOString(),
      }

      channelCallbacks.onCallback({ new: adminReply2 })

      // Invariant Check: unread count increments to 2
      expect(composable.unreadCount.value).toBe(2)
      expect(composable.thread.value?.unread_by_customer_count).toBe(2)
    })

    it('Scenario 3.2: Customer or System message does NOT increment unreadCount when chat window is CLOSED', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-unread-2'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open', unread_by_customer_count: 0 },
          messages: [],
        },
      })
      await composable.initThread()

      composable.isOpen.value = false
      composable.unreadCount.value = 0

      // System message arrives
      channelCallbacks.onCallback({
        new: {
          id: 'sys-msg-info',
          thread_id: threadId,
          sender_type: 'system',
          sender_id: null,
          message_text: 'Admin sedang online',
          created_at: new Date().toISOString(),
        },
      })

      // Customer own message arrives via realtime
      channelCallbacks.onCallback({
        new: {
          id: 'cust-msg-own',
          thread_id: threadId,
          sender_type: 'customer',
          sender_id: 'cust-uuid-1',
          message_text: 'Tes pesan sendiri',
          created_at: new Date().toISOString(),
        },
      })

      // Invariant Check: unreadCount remains 0
      expect(composable.unreadCount.value).toBe(0)
    })

    it('Scenario 3.3: Opening chat window marks thread as read immediately and resets counter', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-unread-3'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open', unread_by_customer_count: 3 },
          messages: [],
        },
      })
      await composable.initThread()

      composable.isOpen.value = false
      composable.unreadCount.value = 3
      if (composable.thread.value) {
        composable.thread.value.unread_by_customer_count = 3
      }

      mockFetch.mockResolvedValueOnce({ status: 'success' })

      // Toggle chat to open
      composable.toggleChat(true)

      // Invariant Check: unreadCount is reset to 0 immediately
      expect(composable.isOpen.value).toBe(true)
      expect(composable.unreadCount.value).toBe(0)
      expect(composable.thread.value?.unread_by_customer_count).toBe(0)
      expect(mockFetch).toHaveBeenCalledWith('/api/support/read', {
        method: 'PATCH',
        body: { thread_id: threadId },
      })
    })

    it('Scenario 3.4: Admin reply arriving while chat window is ALREADY OPEN marks as read immediately without incrementing unreadCount', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-unread-4'

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          thread: { id: threadId, status: 'open', unread_by_customer_count: 0 },
          messages: [],
        },
      })
      await composable.initThread()

      // Chat window is OPEN
      composable.isOpen.value = true
      composable.unreadCount.value = 0

      mockFetch.mockResolvedValue({ status: 'success' })

      const adminReply: SupportMessageItem = {
        id: 'admin-msg-live',
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: 'admin-uuid-1',
        message_text: 'Saya sedang mengecek pesanan Anda di sistem...',
        created_at: new Date().toISOString(),
      }

      channelCallbacks.onCallback({ new: adminReply })

      // Invariant Check: unreadCount is NOT incremented, markAsRead called
      expect(composable.unreadCount.value).toBe(0)
      expect(mockFetch).toHaveBeenCalledWith('/api/support/read', {
        method: 'PATCH',
        body: { thread_id: threadId },
      })
    })

    it('Scenario 3.5: Network failure during markAsRead() degrades gracefully without throwing', async () => {
      const composable = useSupportChat()
      const threadId = 'thread-unread-5'
      composable.thread.value = {
        id: threadId,
        customer_id: 'cust-uuid-1',
        status: 'open',
        last_message_text: null,
        last_message_at: null,
        unread_by_customer_count: 2,
        unread_by_admin_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockFetch.mockRejectedValueOnce(new Error('500 Internal Server Error'))

      // markAsRead should catch error and return false gracefully
      const result = await composable.markAsRead()
      expect(result).toBe(false)
      // Local optimistic unread counter was still reset for client UX
      expect(composable.unreadCount.value).toBe(0)
    })
  })

  describe('4. SSR Hydration Safety & ClientOnly Boundary Verification', () => {
    it('Scenario 4.1: app/layouts/default.vue wraps LiveChatWidget inside <ClientOnly> boundary', () => {
      const layoutPath = path.resolve(process.cwd(), 'app/layouts/default.vue')
      const layoutContent = fs.readFileSync(layoutPath, 'utf8')

      // Assert <ClientOnly> wraps LiveChatWidget
      const clientOnlyRegex = /<ClientOnly>\s*<LiveChatWidget\s*\/>\s*<\/ClientOnly>/
      expect(layoutContent).toMatch(clientOnlyRegex)
    })

    it('Scenario 4.2: useSupportChat guards client-only APIs (useSupabaseClient, watch, onUnmounted) with import.meta.client', () => {
      const composablePath = path.resolve(process.cwd(), 'app/composables/useSupportChat.ts')
      const composableContent = fs.readFileSync(composablePath, 'utf8')

      // 1. Supabase client instantiation is protected by import.meta.client
      expect(composableContent).toMatch(
        /if\s*\(\s*import\.meta\.client\s*\)\s*\{\s*try\s*\{\s*supabase\s*=\s*useSupabaseClient/,
      )

      // 2. subscribeRealtime checks import.meta.client
      expect(composableContent).toMatch(
        /if\s*\(\s*!import\.meta\.client\s*\|\|\s*!supabase\s*\|\|\s*!threadId\s*\)\s*return/,
      )

      // 3. Auth session watcher and lifecycle teardown are protected by import.meta.client
      expect(composableContent).toMatch(/if\s*\(\s*import\.meta\.client\s*\)\s*\{\s*watch\(/)
      expect(composableContent).toMatch(/onUnmounted\(\(\)\s*=>\s*\{\s*cleanupChannel\(\)\s*\}\)/)
    })

    it('Scenario 4.3: LiveChatWidget component includes try-catch fallbacks for useAuth and useSupportChat during isolated/SSR renders', () => {
      const widgetPath = path.resolve(process.cwd(), 'app/components/support/LiveChatWidget.vue')
      const widgetContent = fs.readFileSync(widgetPath, 'utf8')

      expect(widgetContent).toMatch(
        /let\s+auth:\s*ReturnType<typeof\s+useAuth>\s*\|\s*null\s*=\s*null\s*try\s*\{\s*auth\s*=\s*useAuth\(\)\s*\}\s*catch/,
      )
      expect(widgetContent).toMatch(
        /let\s+supportChat:\s*ReturnType<typeof\s+useSupportChat>\s*\|\s*null\s*=\s*null\s*try\s*\{\s*supportChat\s*=\s*useSupportChat\(\)\s*\}\s*catch/,
      )
    })

    it('Scenario 4.4: Maximum attachment size (5MB) and MIME whitelists are enforced in customer composable', () => {
      const composablePath = path.resolve(process.cwd(), 'app/composables/useSupportChat.ts')
      const composableContent = fs.readFileSync(composablePath, 'utf8')

      expect(composableContent).toContain('const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024')
      expect(composableContent).toContain(
        "const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']",
      )
    })
  })
})
