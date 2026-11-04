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
import UiTooltip from '~/components/ui/UiTooltip.vue'

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

const inputText = ref(''),
  previewImage = ref<string | null>(null),
  uploadError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null),
  messageContainer = ref<HTMLElement | null>(null),
  activeLightboxUrl = ref<string | null>(null)
const selectedOrder = ref<OrderPickerItem | null>(null),
  selectedProduct = ref<ProductPickerItem | null>(null)
const isOrderPickerOpen = ref(false),
  isProductPickerOpen = ref(false),
  isEmojiOpen = ref(false)

const effectiveAuth = computed(() =>
  props.isAuthenticated ? true : (supportChat?.isLoggedIn.value ?? false),
)
const effectiveMessages = computed<ChatMessageItem[]>(() => {
  if (props.messages !== undefined) return props.messages
  return (supportChat?.messages.value as ChatMessageItem[]) ?? []
})
const isUploading = computed(() => supportChat?.isUploading.value ?? false)
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
onMounted(() => scrollToBottom())

const handleSend = async () => {
  const text = inputText.value.trim()
  if (
    (!text && !selectedOrder.value && !selectedProduct.value) ||
    inputText.value.length > 1000 ||
    isSending.value
  )
    return

  // Capture before clearing so we can enrich the sent message after send succeeds
  const capturedOrder = selectedOrder.value
  const capturedProduct = selectedProduct.value

  const payload: {
    message_text: string
    attachment_url?: string
    attached_order_id?: string
    attached_product_id?: number
  } = {
    message_text:
      text ||
      (capturedOrder
        ? `Lampiran Pesanan #${capturedOrder.order_number || capturedOrder.id.slice(0, 8)}`
        : `Lampiran Produk ${capturedProduct?.title}`),
  }
  if (previewImage.value) payload.attachment_url = previewImage.value
  if (capturedOrder) payload.attached_order_id = capturedOrder.id
  if (capturedProduct) payload.attached_product_id = capturedProduct.id

  emit('sendMessage', payload)
  if (props.messages === undefined && supportChat) {
    const ok = await supportChat.sendMessage(payload)
    // Enrich the last pushed message with full order/product objects so the
    // snippet components can render immediately without a server round-trip.
    if (ok && (capturedOrder || capturedProduct)) {
      const msgs = supportChat.messages.value
      const last = msgs[msgs.length - 1] as ChatMessageItem | undefined
      if (last && last.sender_type === 'customer') {
        if (capturedOrder) last.attached_order = capturedOrder
        if (capturedProduct) last.attached_product = capturedProduct
      }
    }
  }

  inputText.value = ''
  previewImage.value = null
  selectedOrder.value = null
  selectedProduct.value = null
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
  uploadError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Ukuran berkas maksimal 5MB.'
    if (target) target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  if (supportChat) {
    const url = await supportChat.uploadAttachment(file)
    if (url) {
      previewImage.value = url
    } else {
      uploadError.value = 'Gagal mengunggah foto lampiran.'
      previewImage.value = null
    }
  }
  if (target) target.value = ''
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
    class="live-chat-window fixed bottom-0 right-4 sm:right-6 z-50 flex h-[600px] max-h-[calc(100vh-1rem)] w-[400px] max-w-[calc(100vw-1rem)] flex-col rounded-t-2xl border-t border-x border-brand-hair bg-white shadow-floating"
    role="dialog"
    aria-modal="true"
    aria-label="Jendela Live Chat Bantuan ShelfStack"
  >
    <!-- Header: Shopee Style Docked Bar -->
    <header
      class="chat-header flex items-center justify-between border-b border-brand-hair bg-brand-canvas px-4 py-3 shrink-0"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-sm text-brand-ink">ShelfStack Support</span>
        <span
          class="cs-online-badge inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          CS Online
        </span>
      </div>
      <div class="flex items-center gap-1">
        <UiTooltip text="Kecilkan" position="top">
          <button
            type="button"
            class="btn-minimize flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
            aria-label="Kecilkan jendela chat"
            @click="emit('close')"
          >
            <i class="pi pi-minus text-xs" />
          </button>
        </UiTooltip>
        <UiTooltip text="Tutup Bantuan" position="top">
          <button
            type="button"
            class="btn-close flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
            aria-label="Tutup jendela chat"
            @click="emit('close')"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </UiTooltip>
      </div>
    </header>

    <!-- Guest Unauthenticated Wall -->
    <ChatGuestPrompt v-if="!effectiveAuth" />

    <!-- Authenticated Stream & Composer -->
    <div v-else class="authenticated-chat-body flex flex-1 flex-col overflow-hidden">
      <!-- Message Stream -->
      <div
        ref="messageContainer"
        class="message-stream flex-1 overflow-y-auto bg-brand-canvas-soft/40 p-4 space-y-3"
      >
        <div
          v-if="effectiveMessages.length === 0"
          class="flex h-full items-center justify-center text-center text-xs text-brand-muted p-6"
        >
          <p class="m-0">Belum ada pesan. Mulai percakapan dengan tim bantuan kami di bawah.</p>
        </div>

        <template v-for="msg in effectiveMessages" :key="msg.id">
          <!-- System Note (Clean Informational Card) -->
          <div
            v-if="msg.sender_type === 'system'"
            class="system-bubble mx-auto my-1 max-w-[90%] rounded-card border border-brand-hair bg-white p-3 text-center text-xs text-brand-muted leading-relaxed shadow-whisper"
          >
            {{ msg.message_text }}
          </div>

          <!-- Customer Message (Dynamic fit right) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="customer-bubble ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-xs bg-brand-ink px-3 py-2 text-white shadow-whisper space-y-1.5"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90 shadow-xs"
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
            class="admin-bubble mr-auto w-fit max-w-[80%] rounded-2xl rounded-bl-xs border border-brand-hair bg-white px-3 py-2 text-brand-ink shadow-whisper space-y-1.5"
          >
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran gambar"
              class="attachment-preview max-h-40 max-w-full rounded-field cursor-pointer object-cover hover:opacity-90 shadow-xs"
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

      <!-- Attachment Staging Drawer -->
      <div
        v-if="previewImage || selectedOrder || selectedProduct || uploadError"
        class="border-t border-brand-hair bg-brand-canvas-soft px-3 py-2 flex items-center justify-between text-xs shrink-0"
      >
        <div v-if="previewImage" class="flex items-center gap-2">
          <img
            :src="previewImage"
            alt="Lampiran"
            class="h-8 w-8 rounded-field object-cover border border-brand-hair shadow-xs"
          />
          <span class="text-[11px] text-brand-muted truncate max-w-[170px]">Foto siap dikirim</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs p-1"
            @click="previewImage = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="selectedOrder" class="flex items-center gap-2">
          <i class="pi pi-receipt text-xs text-brand-accent" />
          <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[170px]">{{
            selectedOrder.order_number || selectedOrder.id.slice(0, 8)
          }}</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs p-1"
            @click="selectedOrder = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div v-else-if="selectedProduct" class="flex items-center gap-2">
          <i class="pi pi-box text-xs text-brand-accent" />
          <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[170px]">{{
            selectedProduct.title
          }}</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink text-xs p-1"
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
      <div v-if="isEmojiOpen" class="absolute bottom-24 left-3 z-30">
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

      <!-- Two-Row Spacious Composer -->
      <div class="composer border-t border-brand-hair bg-white p-3 shrink-0 space-y-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />

        <!-- Row 1: Full-width Textarea with comfortable height -->
        <textarea
          v-model="inputText"
          rows="2"
          maxlength="1000"
          placeholder="Ketik pesan untuk Customer Support..."
          class="composer-input w-full resize-none rounded-field border border-brand-hair bg-brand-canvas-soft px-3 py-2 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors leading-relaxed"
          @keydown.enter.exact.prevent="handleSend"
        />

        <!-- Row 2: Action Toolbar & Send Button -->
        <div class="flex items-center justify-between gap-2 pt-0.5">
          <!-- Left: Attachment Action Buttons with UiTooltip -->
          <div class="flex items-center gap-1">
            <UiTooltip text="Lampirkan Foto" position="top">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
                aria-label="Lampirkan foto"
                :disabled="isUploading || isSending"
                @click="fileInput?.click()"
              >
                <i :class="isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-image'" class="text-sm" />
              </button>
            </UiTooltip>

            <UiTooltip text="Pilih Emotikon" position="top">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
                aria-label="Pilih emotikon"
                @click="isEmojiOpen = !isEmojiOpen"
              >
                <i class="pi pi-face-smile text-sm" />
              </button>
            </UiTooltip>

            <UiTooltip text="Lampirkan Pesanan" position="top">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
                aria-label="Lampirkan pesanan"
                @click="isOrderPickerOpen = true"
              >
                <i class="pi pi-receipt text-sm" />
              </button>
            </UiTooltip>

            <UiTooltip text="Lampirkan Produk" position="top">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
                aria-label="Lampirkan produk"
                @click="isProductPickerOpen = true"
              >
                <i class="pi pi-box text-sm" />
              </button>
            </UiTooltip>
          </div>

          <!-- Right: Character Counter & Send Button -->
          <div class="flex items-center gap-2">
            <span class="char-counter text-[10px] text-brand-muted tabular-nums"
              >{{ inputText.length }}/1000</span
            >
            <button
              type="button"
              class="btn-send inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-inkhover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="
                (!inputText.trim() && !selectedOrder && !selectedProduct) ||
                inputText.length > 1000 ||
                isSending
              "
              @click="handleSend"
            >
              <i class="pi pi-send text-[10px]" />
              <span>Kirim</span>
            </button>
          </div>
        </div>
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
