<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import AdminCannedResponseMenu from './AdminCannedResponseMenu.vue'

export interface SupportThreadCustomer {
  id: string
  customer_name: string
  customer_email: string
  status: string
  total_orders?: number
  customer_avatar_url?: string | null
}

export interface SupportPaneMessage {
  id: string
  sender_type: 'customer' | 'admin' | 'system'
  message_text: string
  created_at: string
  attachment_url?: string | null
  attachment_type?: string | null
}

interface Props {
  thread?: SupportThreadCustomer | null
  messages?: SupportPaneMessage[]
}

const props = withDefaults(defineProps<Props>(), {
  thread: undefined,
  messages: undefined,
})

const emit = defineEmits<{
  sendMessage: [payload: { message_text: string; attachment_url?: string }]
  updateStatus: [newStatus: string]
}>()

interface AdminSupportChatComposable {
  activeThread: { value: SupportThreadCustomer | null }
  messages: { value: SupportPaneMessage[] }
  isSending: { value: boolean }
  sendAdminMessage: (payload: { message_text: string; attachment_url?: string }) => Promise<unknown>
  updateStatus: (newStatus: string) => Promise<unknown>
}

let adminChat: AdminSupportChatComposable | null = null
try {
  if (typeof useAdminSupportChat === 'function') {
    adminChat = useAdminSupportChat() as unknown as AdminSupportChatComposable
  }
} catch {
  // Graceful fallback for isolated unit tests
}

const replyText = ref('')
const isCannedOpen = ref(false)
const activeLightboxUrl = ref<string | null>(null)
const messageContainer = ref<HTMLElement | null>(null)

const effectiveThread = computed<SupportThreadCustomer | null>(() => {
  if (props.thread !== undefined) return props.thread
  return adminChat?.activeThread?.value ?? null
})

const effectiveMessages = computed<SupportPaneMessage[]>(() => {
  if (props.messages !== undefined) return props.messages
  return (adminChat?.messages?.value as SupportPaneMessage[]) ?? []
})

const isSending = computed<boolean>(() => adminChat?.isSending?.value ?? false)

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(
  () => effectiveMessages.value.length,
  () => scrollToBottom(),
)
onMounted(() => scrollToBottom())

const handleSend = async () => {
  const text = replyText.value.trim()
  if (!text || isSending.value) return

  const payload = { message_text: text }
  emit('sendMessage', payload)
  if (adminChat) {
    await adminChat.sendAdminMessage(payload)
  }
  replyText.value = ''
  isCannedOpen.value = false
  scrollToBottom()
}

const handleResolve = async () => {
  emit('updateStatus', 'resolved')
  if (adminChat && effectiveThread.value?.id) {
    await adminChat.updateStatus('resolved')
  }
}

const onStatusSelectChange = async (e: Event) => {
  const newStatus = (e.target as HTMLSelectElement).value
  emit('updateStatus', newStatus)
  if (adminChat && effectiveThread.value?.id) {
    await adminChat.updateStatus(newStatus)
  }
}

const onCannedSelect = (text: string) => {
  replyText.value = text
  isCannedOpen.value = false
}

const openLightbox = (url: string) => {
  activeLightboxUrl.value = url
}
const closeLightbox = () => {
  activeLightboxUrl.value = null
}

const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const statusBadgeMap: Record<string, string> = {
  open: 'bg-sky-100 text-sky-800',
  waiting_admin: 'bg-amber-100 text-amber-800',
  waiting_customer: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
}
const getStatusBadgeClass = (status: string): string =>
  statusBadgeMap[status] || 'bg-gray-100 text-gray-800'
</script>

<template>
  <div class="admin-support-chat-pane flex h-full flex-col bg-white">
    <!-- Empty State when no thread is selected -->
    <div
      v-if="!effectiveThread"
      class="empty-pane flex flex-1 items-center justify-center text-xs text-brand-muted h-full"
    >
      Pilih thread untuk memulai percakapan
    </div>

    <!-- Active Conversation View -->
    <div v-else class="active-pane flex flex-1 flex-col h-full min-h-0">
      <!-- Header -->
      <div
        class="pane-header flex items-center justify-between border-b border-brand-hair bg-white p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="customer-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-xs font-semibold text-brand-ink overflow-hidden"
          >
            <img
              v-if="effectiveThread.customer_avatar_url"
              :src="effectiveThread.customer_avatar_url"
              :alt="effectiveThread.customer_name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ getInitials(effectiveThread.customer_name) }}</span>
          </div>
          <div>
            <div class="customer-name text-sm font-semibold text-brand-ink">
              {{ effectiveThread.customer_name }}
            </div>
            <div class="customer-email text-xs text-brand-muted">
              {{ effectiveThread.customer_email }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Status Badge -->
          <span
            class="status-badge rounded px-2 py-0.5 text-xs font-medium"
            :data-status="effectiveThread.status"
            :class="getStatusBadgeClass(effectiveThread.status)"
          >
            {{ effectiveThread.status }}
          </span>

          <!-- Status Selector Dropdown -->
          <select
            :value="effectiveThread.status"
            class="status-select rounded border border-brand-hair bg-white px-2 py-1 text-xs text-brand-ink focus:border-brand-ink focus:outline-none"
            aria-label="Ubah status percakapan"
            @change="onStatusSelectChange"
          >
            <option value="open">open</option>
            <option value="waiting_admin">waiting_admin</option>
            <option value="waiting_customer">waiting_customer</option>
            <option value="resolved">resolved</option>
          </select>

          <!-- 1-Click Resolve Button -->
          <button
            type="button"
            class="btn-resolve rounded bg-emerald-600 px-3 py-1 text-xs text-white transition-colors hover:bg-emerald-700 font-medium"
            @click="handleResolve"
          >
            Selesaikan Tiket
          </button>
        </div>
      </div>

      <!-- Message Stream -->
      <div
        ref="messageContainer"
        class="pane-messages flex-1 overflow-y-auto bg-brand-canvas p-4 space-y-3"
      >
        <template v-for="msg in effectiveMessages" :key="msg.id">
          <!-- System Note -->
          <div
            v-if="msg.sender_type === 'system'"
            class="message-bubble system-bubble mx-auto max-w-[90%] rounded-full border border-brand-hairsoft bg-brand-canvas-soft px-3 py-1 text-center text-[11px] text-brand-muted"
          >
            <p class="text-xs m-0">{{ msg.message_text }}</p>
          </div>

          <!-- Customer Message (Left) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="message-bubble customer-bubble mr-auto max-w-[80%] rounded-2xl rounded-bl-sm border border-brand-hair bg-white p-3 text-brand-ink shadow-whisper space-y-1"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-2 max-w-xs max-h-48 rounded object-cover cursor-pointer hover:opacity-90"
              @click="openLightbox(msg.attachment_url)"
            />
          </div>

          <!-- Admin Message (Right) -->
          <div
            v-else
            class="message-bubble admin-bubble ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand-ink text-white p-3 shadow-whisper space-y-1"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-2 max-w-xs max-h-48 rounded object-cover cursor-pointer hover:opacity-90"
              @click="openLightbox(msg.attachment_url)"
            />
          </div>
        </template>
      </div>

      <!-- Composer Bar -->
      <div class="pane-composer relative border-t border-brand-hair bg-white p-3">
        <!-- Canned Response Picker Popover -->
        <div v-if="isCannedOpen" class="absolute bottom-16 left-3 z-30">
          <AdminCannedResponseMenu @select="onCannedSelect" @select-response="onCannedSelect" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Canned Responses Trigger -->
          <button
            type="button"
            class="btn-canned rounded border border-brand-hair px-2 py-1.5 text-xs text-brand-muted transition-colors hover:text-brand-ink"
            @click="isCannedOpen = !isCannedOpen"
          >
            Pesan Cepat
          </button>

          <!-- Composer Textarea -->
          <textarea
            v-model="replyText"
            rows="1"
            maxlength="1000"
            placeholder="Ketik balasan untuk pelanggan..."
            class="composer-textarea composer-input flex-1 resize-none rounded border border-brand-hair p-2 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:outline-none transition-colors"
            @keydown.enter.exact.prevent="handleSend"
          />

          <!-- Character Counter -->
          <span class="char-counter shrink-0 text-[10px] text-brand-muted tabular-nums"
            >{{ replyText.length }}/1000</span
          >

          <!-- Send Action Button -->
          <button
            type="button"
            class="btn-admin-send btn-send rounded bg-brand-ink px-3 py-1.5 text-xs text-white transition-colors hover:bg-brand-inkhover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            :disabled="!replyText.trim() || isSending"
            @click="handleSend"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal Overlay -->
    <div
      v-if="activeLightboxUrl"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click="closeLightbox"
    >
      <button
        type="button"
        class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 text-xs"
        aria-label="Tutup pratinjau"
        @click="closeLightbox"
      >
        <i class="pi pi-times" />
      </button>
      <img
        :src="activeLightboxUrl"
        alt="Pratinjau lampiran"
        class="max-h-[85vh] max-w-[85vw] rounded-card object-contain shadow-floating"
        @click.stop
      />
    </div>
  </div>
</template>
