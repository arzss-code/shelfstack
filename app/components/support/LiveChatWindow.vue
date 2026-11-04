<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSupportChat } from '~/composables/useSupportChat'
import ChatOrderSnippet from './ChatOrderSnippet.vue'
import ChatProductSnippet from './ChatProductSnippet.vue'
import ChatEmojiPicker from './ChatEmojiPicker.vue'
import ChatGuestPrompt from './ChatGuestPrompt.vue'
import ChatLightboxModal from './ChatLightboxModal.vue'
import ChatOrderPickerModal, { type OrderPickerItem } from './ChatOrderPickerModal.vue'
import ChatProductPickerModal, { type ProductPickerItem } from './ChatProductPickerModal.vue'

export interface ChatMessageItem {
  id: string
  sender_type: 'customer' | 'admin' | 'system'
  message_text: string
  created_at: string
  attachment_url?: string | null
  attachment_type?: string | null
  attached_order?: any | null
  attached_product?: any | null
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
  sendMessage: [
    payload: {
      message_text: string
      attachment_url?: string
      attached_order_id?: string
      attached_product_id?: number
    },
  ]
}>()

let supportChat: ReturnType<typeof useSupportChat> | null = null
try {
  supportChat = useSupportChat()
} catch {
  // Composable fallback in unit testing environments
}

const inputText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const previewImage = ref<string | null>(null)
const selectedOrder = ref<OrderPickerItem | null>(null)
const selectedProduct = ref<ProductPickerItem | null>(null)
const isOrderPickerOpen = ref(false)
const isProductPickerOpen = ref(false)
const activeLightboxUrl = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const isUploading = ref(false)
const isEmojiOpen = ref(false)
const messageContainer = ref<HTMLElement | null>(null)

const effectiveMessages = computed<ChatMessageItem[]>(() => {
  if (props.messages !== undefined) return props.messages
  return (supportChat?.messages.value as unknown as ChatMessageItem[]) ?? []
})

const isSending = computed(() => supportChat?.isSending.value ?? false)

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value)
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  })
}

watch(
  () => effectiveMessages.value.length,
  () => scrollToBottom(),
)

onMounted(() => {
  scrollToBottom()
  if (supportChat && props.isAuthenticated) supportChat.markAsRead()
})

const handleSend = async () => {
  let text = inputText.value.trim()
  if (!text && selectedOrder.value) {
    text = `Mohon bantuan terkait pesanan ${selectedOrder.value.order_number || selectedOrder.value.id}`
  } else if (!text && selectedProduct.value) {
    text = `Halo, saya ingin menanyakan produk ${selectedProduct.value.title}`
  }

  if (!text || text.length > 1000 || isSending.value) return

  const payload: any = { message_text: text }
  if (previewImage.value) payload.attachment_url = previewImage.value
  if (selectedOrder.value) {
    payload.attached_order_id = selectedOrder.value.id
    payload.attachment_type = 'order_card'
  } else if (selectedProduct.value) {
    payload.attached_product_id = selectedProduct.value.id
    payload.attachment_type = 'product_card'
  }

  emit('sendMessage', payload)
  if (supportChat) await supportChat.sendMessage(payload)

  inputText.value = ''
  previewImage.value = null
  selectedOrder.value = null
  selectedProduct.value = null
  uploadError.value = null
  isEmojiOpen.value = false
  scrollToBottom()
}

const onSelectOrder = (o: OrderPickerItem) => {
  selectedOrder.value = o
  selectedProduct.value = null
  isOrderPickerOpen.value = false
}
const onSelectProduct = (p: ProductPickerItem) => {
  selectedProduct.value = p
  selectedOrder.value = null
  isProductPickerOpen.value = false
}

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
    } catch (err: any) {
      uploadError.value = err?.message || 'Gagal mengunggah foto.'
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

const formatTime = (isoString?: string): string => {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return ''
  }
}
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
      class="chat-header flex items-center justify-between border-b border-brand-hair bg-brand-canvas px-4 py-3 shrink-0"
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
        @click="emit('close')"
      >
        <i class="pi pi-times text-xs" aria-hidden="true" />
      </button>
    </header>

    <!-- Guest Mode Card (Unauthenticated) -->
    <ChatGuestPrompt v-if="!isAuthenticated" />

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
          <!-- System Note (Clean Card instead of Oval Badge) -->
          <div
            v-if="msg.sender_type === 'system'"
            class="system-bubble mx-auto my-1 max-w-[90%] rounded-card border border-brand-hair bg-white p-3 text-center text-xs text-brand-muted leading-relaxed shadow-whisper"
          >
            {{ msg.message_text }}
          </div>

          <!-- Customer Message (Dynamic fit right) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="customer-bubble ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-brand-ink p-3 text-white shadow-whisper space-y-1.5"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
            <ChatProductSnippet v-if="msg.attached_product" :product="msg.attached_product" />
            <div class="flex items-center justify-end text-[10px] text-white/70 tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>

          <!-- Admin Message (Dynamic fit left) -->
          <div
            v-else
            class="admin-bubble mr-auto w-fit max-w-[80%] rounded-2xl rounded-bl-sm border border-brand-hair bg-white p-3 text-brand-ink shadow-whisper space-y-1.5"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
            <ChatProductSnippet v-if="msg.attached_product" :product="msg.attached_product" />
            <div class="flex items-center justify-end text-[10px] text-brand-muted tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Attachment staging bar -->
      <div
        v-if="previewImage || selectedOrder || selectedProduct || uploadError"
        class="border-t border-brand-hairsoft bg-brand-canvas-soft px-3 py-2 flex items-center justify-between text-xs"
      >
        <div v-if="previewImage" class="flex items-center gap-2">
          <img :src="previewImage" alt="Lampiran" class="h-7 w-7 rounded object-cover" />
          <span class="text-[11px] text-brand-muted truncate max-w-[150px]">Gambar siap kirim</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs"
            @click="previewImage = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="selectedOrder" class="flex items-center gap-2">
          <i class="pi pi-receipt text-xs text-brand-accent" />
          <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[160px]">{{
            selectedOrder.order_number || selectedOrder.id.slice(0, 8)
          }}</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs"
            @click="selectedOrder = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="selectedProduct" class="flex items-center gap-2">
          <i class="pi pi-box text-xs text-brand-accent" />
          <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[160px]">{{
            selectedProduct.title
          }}</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs"
            @click="selectedProduct = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="uploadError" class="text-[11px] text-red-600 font-medium">
          {{ uploadError }}
        </div>
      </div>

      <!-- Emoji Picker Popover -->
      <div v-if="isEmojiOpen" class="absolute bottom-16 left-3 z-30">
        <ChatEmojiPicker
          @select-emoji="
            (e) => {
              inputText += e
              isEmojiOpen = false
            }
          "
          @close="isEmojiOpen = false"
        />
      </div>

      <!-- Composer Input Bar -->
      <div class="composer flex items-center gap-1.5 border-t border-brand-hair bg-white p-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
          title="Lampirkan foto"
          :disabled="isUploading || isSending"
          @click="fileInput?.click()"
        >
          <i :class="isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-image'" class="text-xs" />
        </button>
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
          title="Pilih emotikon"
          @click="isEmojiOpen = !isEmojiOpen"
        >
          <i class="pi pi-face-smile text-xs" />
        </button>
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
          title="Lampirkan pesanan"
          @click="isOrderPickerOpen = true"
        >
          <i class="pi pi-receipt text-xs" />
        </button>
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
          title="Lampirkan produk"
          @click="isProductPickerOpen = true"
        >
          <i class="pi pi-box text-xs" />
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
          class="btn-send shrink-0 rounded-full bg-brand-ink px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-inkhover disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="
            (!inputText.trim() && !selectedOrder && !selectedProduct) ||
            inputText.length > 1000 ||
            isSending
          "
          @click="handleSend"
        >
          Kirim
        </button>
      </div>
    </div>

    <!-- Modals -->
    <ChatOrderPickerModal
      :is-open="isOrderPickerOpen"
      @select-order="onSelectOrder"
      @close="isOrderPickerOpen = false"
    />
    <ChatProductPickerModal
      :is-open="isProductPickerOpen"
      @select-product="onSelectProduct"
      @close="isProductPickerOpen = false"
    />
    <ChatLightboxModal :image-url="activeLightboxUrl" @close="activeLightboxUrl = null" />
  </div>
</template>
