import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { computed, getCurrentInstance, onUnmounted } from 'vue'
import type { Database } from '~/types/database.types'
import { SUPPORT_CANNED_RESPONSES, SUPPORT_STATUS_MAP } from '~~/server/utils/support-chat'
import type {
  AdminSendSupportMessageInput,
  SupportMessageItem,
  SupportThreadItem,
  SupportThreadStatus,
  SupportThreadWithCustomer,
} from '~~/shared/schemas/support-chat'

// Module-level singletons across admin page and child components to prevent duplicate subscriptions
let sharedInboxChannel: RealtimeChannel | null = null
let sharedMessageChannel: RealtimeChannel | null = null
let activeSubscribedThreadId: string | null = null

function getFreshChannel(client: SupabaseClient<Database>, topic: string): RealtimeChannel {
  try {
    const existing = client
      .getChannels()
      .find((ch) => ch.topic === topic || ch.topic === `realtime:${topic}`)
    if (existing) {
      client.removeChannel(existing)
    }
  } catch {
    // Safe fallback for testing environments
  }
  return client.channel(topic)
}

export function useAdminSupportChat() {
  let supabase: SupabaseClient<Database> | null = null
  if (import.meta.client) {
    try {
      supabase = useSupabaseClient<Database>()
    } catch {
      // Supabase client fallback in unit tests
    }
  }

  // Reactive state shared across admin workspace panes
  const threads = useState<SupportThreadWithCustomer[]>('admin-support-threads', () => [])
  const activeThreadId = useState<string | null>('admin-support-active-id', () => null)
  const messages = useState<SupportMessageItem[]>('admin-support-messages', () => [])
  const activeFilter = useState<string>('admin-support-filter', () => 'all')
  const searchQuery = useState<string>('admin-support-search', () => '')
  const isLoadingThreads = useState<boolean>('admin-support-loading-threads', () => false)
  const isLoadingMessages = useState<boolean>('admin-support-loading-messages', () => false)
  const isSending = useState<boolean>('admin-support-is-sending', () => false)
  const error = useState<string | null>('admin-support-error', () => null)

  const activeThread = computed<SupportThreadWithCustomer | null>(() =>
    activeThreadId.value ? threads.value.find((t) => t.id === activeThreadId.value) || null : null,
  )

  const cleanupInbox = () => {
    if (sharedInboxChannel && supabase) {
      try {
        supabase.removeChannel(sharedInboxChannel)
      } catch {
        // Safe removal
      }
      sharedInboxChannel = null
    }
  }

  const cleanupMessage = () => {
    if (sharedMessageChannel && supabase) {
      try {
        supabase.removeChannel(sharedMessageChannel)
      } catch {
        // Safe removal
      }
      sharedMessageChannel = null
      activeSubscribedThreadId = null
    }
  }

  const cleanupAll = () => {
    cleanupInbox()
    cleanupMessage()
  }

  const handleIncomingMessage = (newMsg: SupportMessageItem) => {
    if (!newMsg || newMsg.deleted_at || newMsg.thread_id !== activeThreadId.value) return
    if (messages.value.some((m) => m.id === newMsg.id)) return // Deduplication check

    messages.value.push(newMsg)
    const thread = threads.value.find((t) => t.id === newMsg.thread_id)
    if (thread) {
      thread.last_message_text = newMsg.message_text
      thread.last_message_at = newMsg.created_at
      if (newMsg.sender_type === 'customer') {
        thread.status = 'waiting_admin'
        thread.unread_by_admin_count = 0
      }
    }
  }

  const handleInboxUpdate = (payload: { eventType: string; new: SupportThreadItem }) => {
    const updated = payload.new
    if (!updated || updated.deleted_at) return
    const existing = threads.value.find((t) => t.id === updated.id)
    if (!existing) {
      fetchThreads() // New thread: reload to fetch customer details
      return
    }
    existing.last_message_text = updated.last_message_text
    existing.last_message_at = updated.last_message_at
    existing.status = updated.status
    existing.updated_at = updated.updated_at
    existing.unread_by_customer_count = updated.unread_by_customer_count
    existing.unread_by_admin_count =
      activeThreadId.value === updated.id ? 0 : updated.unread_by_admin_count
    threads.value.sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at).getTime()
      const timeB = new Date(b.last_message_at || b.created_at).getTime()
      return timeB - timeA
    })
  }

  const subscribeInbox = () => {
    if (!import.meta.client || !supabase || sharedInboxChannel) return
    try {
      sharedInboxChannel = getFreshChannel(supabase, 'admin-support-inbox')
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'support_threads' },
          handleInboxUpdate,
        )
        .subscribe()
    } catch {
      // Safe fallback
    }
  }

  const subscribeThreadMessages = (threadId: string) => {
    if (!import.meta.client || !supabase || !threadId) return
    if (activeSubscribedThreadId === threadId && sharedMessageChannel) return

    cleanupMessage()
    activeSubscribedThreadId = threadId
    try {
      sharedMessageChannel = getFreshChannel(supabase, `support-thread-${threadId}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `thread_id=eq.${threadId}`,
          },
          (p: { new: SupportMessageItem }) => handleIncomingMessage(p.new),
        )
        .subscribe()
    } catch {
      // Safe fallback
    }
  }

  const fetchThreads = async (params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    isLoadingThreads.value = true
    error.value = null
    try {
      const res = await $fetch<{
        status: string
        data: { threads: SupportThreadWithCustomer[]; total: number }
      }>('/api/admin/support/threads', {
        query: {
          status: params?.status ?? activeFilter.value,
          search: (params?.search ?? searchQuery.value)?.trim() || undefined,
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
        },
      })
      if (res?.data) {
        threads.value = res.data.threads || []
        subscribeInbox()
        return res.data
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal memuat daftar thread bantuan.'
      return null
    } finally {
      isLoadingThreads.value = false
    }
  }

  const selectThread = async (threadId: string) => {
    activeThreadId.value = threadId
    const target = threads.value.find((t) => t.id === threadId)
    if (target) target.unread_by_admin_count = 0
    subscribeThreadMessages(threadId)
    isLoadingMessages.value = true
    error.value = null
    try {
      const res = await $fetch<{
        status: string
        data: { thread: SupportThreadItem; messages: SupportMessageItem[] }
      }>(`/api/admin/support/threads/${threadId}/messages`)
      if (res?.data) {
        if (activeThreadId.value === threadId) messages.value = res.data.messages || []
        if (target && res.data.thread) {
          target.status = res.data.thread.status
          target.unread_by_admin_count = 0
        }
        return res.data
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal memuat percakapan bantuan.'
      return null
    } finally {
      if (activeThreadId.value === threadId) isLoadingMessages.value = false
    }
  }

  const sendAdminMessage = async (
    payloadOrText: string | AdminSendSupportMessageInput,
  ): Promise<boolean> => {
    if (!activeThreadId.value) {
      error.value = 'Pilih thread terlebih dahulu untuk mengirim balasan.'
      return false
    }
    const payload: AdminSendSupportMessageInput =
      typeof payloadOrText === 'string' ? { message_text: payloadOrText } : payloadOrText
    const text = payload.message_text?.trim() || ''
    if (!text) {
      error.value = 'Balasan tidak boleh kosong.'
      return false
    }
    if (text.length > 1000) {
      error.value = 'Balasan maksimal 1000 karakter.'
      return false
    }
    isSending.value = true
    error.value = null
    try {
      const res = await $fetch<{ status: string; data: { message: SupportMessageItem } }>(
        `/api/admin/support/threads/${activeThreadId.value}/messages`,
        { method: 'POST', body: payload },
      )
      const newMsg = res?.data?.message
      if (newMsg) {
        if (!messages.value.some((m) => m.id === newMsg.id)) messages.value.push(newMsg)
        const current = threads.value.find((t) => t.id === activeThreadId.value)
        if (current) {
          current.last_message_text = newMsg.message_text
          current.last_message_at = newMsg.created_at
          current.status = 'waiting_customer'
          current.unread_by_admin_count = 0
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal mengirim balasan.'
      return false
    } finally {
      isSending.value = false
    }
  }

  const updateStatus = async (newStatus: SupportThreadStatus): Promise<boolean> => {
    if (!activeThreadId.value) {
      error.value = 'Pilih thread terlebih dahulu untuk memperbarui status.'
      return false
    }
    error.value = null
    try {
      const res = await $fetch<{ status: string; data: { thread: SupportThreadItem } }>(
        `/api/admin/support/threads/${activeThreadId.value}/status`,
        { method: 'PATCH', body: { status: newStatus } },
      )
      if (res?.data) {
        const current = threads.value.find((t) => t.id === activeThreadId.value)
        if (current) {
          current.status = newStatus
          if (newStatus === 'resolved') current.unread_by_admin_count = 0
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal memperbarui status thread.'
      return false
    }
  }

  if (import.meta.client && getCurrentInstance()) {
    onUnmounted(() => {
      cleanupAll()
    })
  }

  return {
    threads,
    activeThreadId,
    activeThread,
    messages,
    activeFilter,
    searchQuery,
    isLoadingThreads,
    isLoadingMessages,
    isSending,
    error,
    cannedResponses: SUPPORT_CANNED_RESPONSES,
    statusMap: SUPPORT_STATUS_MAP,
    fetchThreads,
    selectThread,
    sendAdminMessage,
    updateStatus,
    cleanupAll,
    cleanupInbox,
    cleanupMessage,
  }
}
