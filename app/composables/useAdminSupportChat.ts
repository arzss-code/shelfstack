import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { computed, getCurrentInstance, onUnmounted } from 'vue'
import type { Database } from '~/types/database.types'
import {
  acquireRealtimeChannel,
  teardownRealtimeChannel,
  isChannelSubscribed,
} from '~/utils/supabase-realtime'
import { enrichIncomingMessage, extractErrorMessage } from '~/utils/support-chat-common'
import {
  fetchAdminSupportThreadsApi,
  fetchAdminSupportMessagesApi,
  sendAdminSupportMessageApi,
  updateAdminSupportStatusApi,
  createAdminSupportState,
} from '~/utils/support-chat-admin'
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

export function useAdminSupportChat() {
  let supabase: SupabaseClient<Database> | null = null
  try {
    if (import.meta.client) supabase = useSupabaseClient<Database>()
  } catch {
    // Supabase client fallback
  }

  const {
    threads,
    activeThreadId,
    messages,
    activeFilter,
    searchQuery,
    isLoadingThreads,
    isLoadingMessages,
    isSending,
    error,
  } = createAdminSupportState()

  const activeThread = computed<SupportThreadWithCustomer | null>(() =>
    activeThreadId.value ? threads.value.find((t) => t.id === activeThreadId.value) || null : null,
  )

  const cleanupInbox = () => {
    if (sharedInboxChannel && supabase) {
      teardownRealtimeChannel(supabase, sharedInboxChannel)
      sharedInboxChannel = null
    }
  }

  const cleanupMessage = () => {
    if (sharedMessageChannel && supabase) {
      teardownRealtimeChannel(supabase, sharedMessageChannel)
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
    if (messages.value.some((m) => m.id === newMsg.id)) return

    messages.value.push(enrichIncomingMessage(newMsg, messages.value))
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

  const handleInboxUpdate = (payload: { new: SupportThreadItem }) => {
    const updated = payload?.new
    if (!updated || updated.deleted_at) return
    const existing = threads.value.find((t) => t.id === updated.id)
    if (!existing) {
      fetchThreads()
      return
    }
    Object.assign(existing, {
      last_message_text: updated.last_message_text,
      last_message_at: updated.last_message_at,
      status: updated.status,
      updated_at: updated.updated_at,
      unread_by_customer_count: updated.unread_by_customer_count,
      unread_by_admin_count:
        activeThreadId.value === updated.id ? 0 : updated.unread_by_admin_count,
    })
    threads.value.sort(
      (a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime(),
    )
  }

  const subscribeInbox = () => {
    if (!import.meta.client || !supabase) return
    if (isChannelSubscribed(sharedInboxChannel)) return

    try {
      sharedInboxChannel = acquireRealtimeChannel(supabase, 'admin-support-inbox')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_threads' },
          (payload) => {
            if (payload.eventType !== 'DELETE' && payload.new) {
              handleInboxUpdate({ new: payload.new as unknown as SupportThreadItem })
            }
          },
        )
        .subscribe()
    } catch {
      // Channel subscription fallback
    }
  }

  const subscribeThreadMessages = (threadId: string) => {
    if (!import.meta.client || !supabase || !threadId) return
    if (activeSubscribedThreadId === threadId && isChannelSubscribed(sharedMessageChannel)) return

    cleanupMessage()
    activeSubscribedThreadId = threadId
    try {
      sharedMessageChannel = acquireRealtimeChannel(supabase, `support-thread-${threadId}`)
        .on(
          'postgres_changes',
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
      // Channel subscription fallback
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
      const data = await fetchAdminSupportThreadsApi({
        status: params?.status ?? activeFilter.value,
        search: params?.search ?? searchQuery.value,
        page: params?.page,
        limit: params?.limit,
      })
      if (data) {
        threads.value = data.threads || []
        try {
          subscribeInbox()
        } catch {
          // Inbox subscription fallback
        }
        return data
      }
      return null
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal memuat daftar thread bantuan.')
      return null
    } finally {
      isLoadingThreads.value = false
    }
  }

  const selectThread = async (threadId: string) => {
    activeThreadId.value = threadId
    const target = threads.value.find((t) => t.id === threadId)
    if (target) target.unread_by_admin_count = 0
    try {
      subscribeThreadMessages(threadId)
    } catch {
      // Thread subscription fallback
    }
    isLoadingMessages.value = true
    error.value = null
    try {
      const data = await fetchAdminSupportMessagesApi(threadId)
      if (data) {
        if (activeThreadId.value === threadId) messages.value = data.messages || []
        if (target && data.thread) {
          target.status = data.thread.status
          target.unread_by_admin_count = 0
        }
        return data
      }
      return null
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal memuat percakapan bantuan.')
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
      const newMsg = await sendAdminSupportMessageApi(activeThreadId.value, payload)
      if (newMsg) {
        if (!messages.value.some((m) => m.id === newMsg.id)) messages.value.push(newMsg)
        const current = threads.value.find((t) => t.id === activeThreadId.value)
        if (current) {
          Object.assign(current, {
            last_message_text: newMsg.message_text,
            last_message_at: newMsg.created_at,
            status: 'waiting_customer' as const,
            unread_by_admin_count: 0,
          })
        }
        return true
      }
      return false
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal mengirim balasan.')
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
      const thread = await updateAdminSupportStatusApi(activeThreadId.value, newStatus)
      if (thread) {
        const current = threads.value.find((t) => t.id === activeThreadId.value)
        if (current) {
          current.status = newStatus
          if (newStatus === 'resolved') current.unread_by_admin_count = 0
        }
        return true
      }
      return false
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal memperbarui status thread.')
      return false
    }
  }

  if (import.meta.client && getCurrentInstance()) {
    onUnmounted(() => cleanupAll())
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
