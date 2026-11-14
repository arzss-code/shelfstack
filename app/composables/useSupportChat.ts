import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { onUnmounted, watch } from 'vue'
import type { Database } from '~/types/database.types'
import { useAuth } from '~/features/auth/composables/useAuth'
import {
  acquireRealtimeChannel,
  teardownRealtimeChannel,
  isChannelSubscribed,
} from '~/utils/supabase-realtime'
import {
  enrichIncomingMessage,
  extractErrorMessage,
  parseSendPayload,
} from '~/utils/support-chat-common'
import type {
  SendSupportMessageInput,
  SupportAttachmentType,
  SupportMessageItem,
  SupportThreadItem,
} from '~~/shared/schemas/support-chat'

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useSupportChat() {
  const { isLoggedIn, user, profile } = useAuth()
  let supabase: SupabaseClient<Database> | null = null

  if (import.meta.client) {
    try {
      supabase = useSupabaseClient<Database>()
    } catch {
      // Supabase client fallback
    }
  }

  const thread = useState<SupportThreadItem | null>('support-chat-thread', () => null)
  const messages = useState<SupportMessageItem[]>('support-chat-messages', () => [])
  const isOpen = useState<boolean>('support-chat-is-open', () => false)
  const isLoading = useState<boolean>('support-chat-is-loading', () => false)
  const isSending = useState<boolean>('support-chat-is-sending', () => false)
  const isUploading = useState<boolean>('support-chat-is-uploading', () => false)
  const unreadCount = useState<number>('support-chat-unread-count', () => 0)
  const error = useState<string | null>('support-chat-error', () => null)

  let channel: RealtimeChannel | null = null

  const cleanupChannel = () => {
    if (channel && supabase) {
      teardownRealtimeChannel(supabase, channel)
      channel = null
    }
  }

  const handleIncomingMessage = (newMsg: SupportMessageItem) => {
    if (!newMsg || newMsg.deleted_at || messages.value.some((m) => m.id === newMsg.id)) return

    messages.value.push(enrichIncomingMessage(newMsg, messages.value))

    if (thread.value) {
      thread.value.last_message_text = newMsg.message_text
      thread.value.last_message_at = newMsg.created_at
    }

    if (newMsg.sender_type === 'admin') {
      if (isOpen.value) {
        markAsRead()
      } else {
        unreadCount.value += 1
        if (thread.value) thread.value.unread_by_customer_count = unreadCount.value
      }
    }
  }

  const subscribeRealtime = (threadId: string) => {
    if (!import.meta.client || !supabase || !threadId) return
    if (isChannelSubscribed(channel)) return

    cleanupChannel()
    try {
      channel = acquireRealtimeChannel(supabase, `support-thread-${threadId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `thread_id=eq.${threadId}`,
          },
          (payload: { new: SupportMessageItem }) => handleIncomingMessage(payload.new),
        )
        .subscribe()
    } catch {
      // Channel subscription fallback
    }
  }

  const initThread = async () => {
    if (!isLoggedIn.value) {
      thread.value = null
      messages.value = []
      unreadCount.value = 0
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        status: string
        data: { thread: SupportThreadItem; messages: SupportMessageItem[] }
      }>('/api/support/thread')

      if (response?.data) {
        thread.value = response.data.thread
        messages.value = response.data.messages || []
        unreadCount.value = response.data.thread.unread_by_customer_count || 0
        if (thread.value?.id) subscribeRealtime(thread.value.id)
        return response.data
      }
      return null
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal memuat thread bantuan.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const sendMessage = async (payloadOrText: string | SendSupportMessageInput): Promise<boolean> => {
    if (!isLoggedIn.value) {
      error.value = 'Silakan masuk terlebih dahulu untuk mengirim pesan.'
      return false
    }

    const payload = parseSendPayload(payloadOrText)
    const text = payload.message_text?.trim() || ''
    if (!text) {
      error.value = 'Pesan tidak boleh kosong.'
      return false
    }
    if (text.length > 1000) {
      error.value = 'Pesan maksimal 1000 karakter.'
      return false
    }

    isSending.value = true
    error.value = null

    try {
      const res = await $fetch<{
        status: string
        data: { message: SupportMessageItem; system_message?: SupportMessageItem | null }
      }>('/api/support/messages', { method: 'POST', body: payload })

      if (res?.data) {
        if (!messages.value.some((m) => m.id === res.data.message.id)) {
          messages.value.push(res.data.message)
        }
        if (
          res.data.system_message &&
          !messages.value.some((m) => m.id === res.data.system_message!.id)
        ) {
          messages.value.push(res.data.system_message)
        }
        if (thread.value) {
          thread.value.last_message_text = res.data.message.message_text
          thread.value.last_message_at = res.data.message.created_at
          if (payload.attached_order_id && !thread.value.attached_order_id) {
            thread.value.attached_order_id = payload.attached_order_id
          }
          if (payload.attached_product_id && !thread.value.attached_product_id) {
            thread.value.attached_product_id = payload.attached_product_id
          }
        }
        return true
      }
      return false
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal mengirim pesan bantuan.')
      return false
    } finally {
      isSending.value = false
    }
  }

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!isLoggedIn.value) {
      error.value = 'Silakan masuk untuk mengunggah lampiran.'
      return null
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      error.value = 'Ukuran berkas melebihi batas 5 MB.'
      return null
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      error.value = 'Format berkas tidak didukung. Harap unggah format JPG, PNG, atau WEBP.'
      return null
    }

    isUploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await $fetch<{ status: string; data: { file_url: string; file_path: string } }>(
        '/api/support/upload',
        { method: 'POST', body: formData },
      )
      return res.data?.file_url || null
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Gagal mengunggah gambar lampiran.')
      return null
    } finally {
      isUploading.value = false
    }
  }

  const markAsRead = async (): Promise<boolean> => {
    if (!isLoggedIn.value || !thread.value?.id) {
      unreadCount.value = 0
      return true
    }

    unreadCount.value = 0
    if (thread.value) thread.value.unread_by_customer_count = 0

    try {
      await $fetch('/api/support/read', {
        method: 'PATCH',
        body: { thread_id: thread.value.id },
      })
      return true
    } catch {
      return false
    }
  }

  const toggleChat = (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !isOpen.value
    isOpen.value = nextState
    if (nextState) {
      if (unreadCount.value > 0) markAsRead()
      if (!thread.value && isLoggedIn.value) initThread()
    }
  }

  if (import.meta.client) {
    watch(
      () => isLoggedIn.value,
      (loggedIn) => {
        if (loggedIn) {
          initThread()
        } else {
          cleanupChannel()
          thread.value = null
          messages.value = []
          unreadCount.value = 0
          isOpen.value = false
        }
      },
      { immediate: true },
    )

    onUnmounted(() => {
      cleanupChannel()
    })
  }

  return {
    thread,
    messages,
    isOpen,
    isLoading,
    isSending,
    isUploading,
    unreadCount,
    error,
    user,
    profile,
    isLoggedIn,
    initThread,
    sendMessage,
    uploadAttachment,
    markAsRead,
    toggleChat,
    cleanupChannel,
  }
}
