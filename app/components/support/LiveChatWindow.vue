<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSupportChat } from '~/composables/useSupportChat'
import ChatOrderSnippet from './ChatOrderSnippet.vue'

export interface ChatMessageItem {
  id: string
  sender_type: 'customer' | 'admin' | 'system'
  message_text: string
  created_at: string
  attachment_url?: string | null
  attachment_type?: string | null
  attached_order?: {
    id: string
    order_number?: string | null
    total_cents: number
    status: string
  } | null
}

interface Props {
  isAuthenticated?: boolean
  messages?: ChatMessageItem[]
  unreadCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isAuthenticated: false,
  messages: undefined,
  unreadCount: 0,
})

const emit = defineEmits<{
  close: []
  sendMessage: [payload: { message_text: string; attachment_url?: string }]
}>()

let supportChat: ReturnType<typeof useSupportChat> | null = null
try {
  supportChat = useSupportChat()
} catch {
  // Graceful fallback for isolated unit tests
}

const inputText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const previewImage = ref<string | null>(null)
const activeLightboxUrl = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const isUploading = ref(false)
const messageContainer = ref<HTMLElement | null>(null)

const effectiveMessages = computed<ChatMessageItem[]>(() => {
  if (props.messages !== undefined) return props.messages
  return (supportChat?.messages.value as unknown as ChatMessageItem[]) ?? []
})

const isSending = computed(() => supportChat?.isSending.value ?? false)

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

onMounted(() => {
  scrollToBottom()
  if (supportChat && props.isAuthenticated) {
    supportChat.markAsRead()
  }
})

const handleClose = () => emit('close')

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || text.length > 1000 || isSending.value) return

  const payload: { message_text: string; attachment_url?: string } = { message_text: text }
  if (previewImage.value) {
    payload.attachment_url = previewImage.value
  }

  emit('sendMessage', payload)
  if (supportChat) {
    await supportChat.sendMessage(payload)
  }

  inputText.value = ''
  previewImage.value = null
  uploadError.value = null
  scrollToBottom()
}

const triggerFileUpload = () => fileInput.value?.click()

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadError.value = null
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Ukuran berkas maksimal 5MB.'
    target.value = ''
    return
  }

  if (supportChat) {
    try {
      isUploading.value = true
      previewImage.value = await supportChat.uploadAttachment(file)
    } catch (err: unknown) {
      const e = err as { message?: string }
      uploadError.value = e?.message || 'Gagal mengunggah foto.'
    } finally {
      isUploading.value = false
    }
  } else {
    try {
      previewImage.value = URL.createObjectURL(file)
    } catch {
      previewImage.value = null
    }
  }
  target.value = ''
}

const removeAttachment = () => {
  previewImage.value = null
  uploadError.value = null
}

const openLightbox = (url: string) => {
  activeLightboxUrl.value = url
}
const closeLightbox = () => {
  activeLightboxUrl.value = null
}

const loginUrl = computed(() => {
  let redirect = '/'
  try {
    const route = useRoute()
    if (route?.fullPath) redirect = route.fullPath
  } catch {
    // Fallback if useRoute is unavailable in unit tests
  }
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`
})
</script>

<template>
  <div
    class="live-chat-window fixed bottom-20 right-6 z-50 flex h-[540px] max-h-[calc(100vh-6.5rem)] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-brand-hair bg-white shadow-floating"
    role="dialog"
    aria-modal="true"
    aria-label="Jendela Live Chat Bantuan ShelfStack"
  >
    <!-- Header -->
    <header
      class="chat-header flex items-center justify-between border-b border-brand-hair bg-brand-canvas px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-sm text-brand-ink">ShelfStack Support</span>
        <span
          class="cs-online-badge inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          CS Online
        </span>
      </div>
      <button
        type="button"
        class="btn-close flex h-8 w-8 items-center justify-center rounded-full text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
        aria-label="Tutup jendela chat"
        @click="handleClose"
      >
        <i class="pi pi-times text-xs" aria-hidden="true" />
      </button>
    </header>

    <!-- Guest Mode Card (Unauthenticated) -->
    <div
      v-if="!isAuthenticated"
      class="guest-prompt-card flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-ink"
      >
        <i class="pi pi-user text-xl text-brand-muted" aria-hidden="true" />
      </div>
      <h3 class="m-0 text-sm font-bold text-brand-ink">Silakan Masuk untuk Memulai Chat</h3>
      <p class="m-0 text-xs text-brand-muted max-w-xs leading-relaxed">
        Masuk ke akun ShelfStack Anda agar kami dapat memeriksa riwayat pesanan dan memberikan
        bantuan lebih cepat.
      </p>
      <a
        :href="loginUrl"
        class="btn-login inline-flex items-center justify-center rounded-full bg-brand-ink px-5 py-2 text-xs font-semibold text-white no-underline transition-all hover:bg-brand-inkhover active:scale-95 shadow-whisper"
      >
        Masuk Akun
      </a>
    </div>

    <!-- Authenticated Conversation Body -->
    <div v-else class="authenticated-chat-body flex flex-1 flex-col min-h-0 bg-brand-canvas">
      <!-- Message Stream -->
      <div ref="messageContainer" class="message-stream flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-if="effectiveMessages.length === 0"
          class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-xs text-brand-muted"
        >
          <i class="pi pi-comments text-2xl text-brand-faint" aria-hidden="true" />
          <p class="m-0">Belum ada pesan. Mulai percakapan dengan tim bantuan kami di bawah.</p>
        </div>

        <template v-for="msg in effectiveMessages" :key="msg.id">
          <!-- System Pill -->
          <div
            v-if="msg.sender_type === 'system'"
            class="system-bubble mx-auto max-w-[90%] rounded-full border border-brand-hairsoft bg-brand-canvas-soft px-3 py-1.5 text-center text-[11px] leading-relaxed text-brand-muted"
          >
            {{ msg.message_text }}
          </div>

          <!-- Customer Message (Right) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="customer-bubble ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand-ink p-3 text-white shadow-whisper space-y-2"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90"
              @click="openLightbox(msg.attachment_url)"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
          </div>

          <!-- Admin Message (Left) -->
          <div
            v-else
            class="admin-bubble mr-auto max-w-[80%] rounded-2xl rounded-bl-sm border border-brand-hair bg-white p-3 text-brand-ink shadow-whisper space-y-2"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90"
              @click="openLightbox(msg.attachment_url)"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
          </div>
        </template>
      </div>

      <!-- Attachment staging bar -->
      <div
        v-if="previewImage || uploadError"
        class="border-t border-brand-hairsoft bg-brand-canvas-soft px-3 py-2 flex items-center justify-between text-xs"
      >
        <div v-if="previewImage" class="flex items-center gap-2">
          <img :src="previewImage" alt="Lampiran" class="h-8 w-8 rounded object-cover" />
          <span class="text-[11px] text-brand-muted truncate max-w-[180px]">Gambar siap kirim</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs"
            @click="removeAttachment"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="uploadError" class="text-[11px] text-red-600 font-medium">
          {{ uploadError }}
        </div>
      </div>

      <!-- Composer Input Bar -->
      <div class="composer flex items-center gap-2 border-t border-brand-hair bg-white p-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
          title="Lampirkan foto (maks 5MB)"
          :disabled="isUploading || isSending"
          @click="triggerFileUpload"
        >
          <i
            :class="isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-image'"
            class="text-xs"
            aria-hidden="true"
          />
        </button>
        <textarea
          v-model="inputText"
          rows="1"
          maxlength="1000"
          placeholder="Ketik pesan..."
          class="composer-input flex-1 resize-none rounded-field border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:outline-none transition-colors"
          @keydown.enter.exact.prevent="handleSend"
        />
        <span class="char-counter shrink-0 text-[10px] text-brand-muted tabular-nums"
          >{{ inputText.length }}/1000</span
        >
        <button
          type="button"
          class="btn-send shrink-0 rounded-full bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-inkhover disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!inputText.trim() || inputText.length > 1000 || isSending"
          @click="handleSend"
        >
          Kirim
        </button>
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
        class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
        aria-label="Tutup pratinjau"
        @click="closeLightbox"
      >
        <i class="pi pi-times text-base" />
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
