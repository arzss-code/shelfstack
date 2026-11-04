<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useSupportChat } from '~/composables/useSupportChat'
import ChatOrderSnippet from './ChatOrderSnippet.vue'
import ChatProductSnippet from './ChatProductSnippet.vue'
import ChatGuestPrompt from './ChatGuestPrompt.vue'
import ChatLightboxModal from './ChatLightboxModal.vue'
import ChatOrderPickerModal, { type OrderPickerItem } from './ChatOrderPickerModal.vue'
import ChatProductPickerModal, { type ProductPickerItem } from './ChatProductPickerModal.vue'
import LiveChatComposer from './LiveChatComposer.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'
import type { SupportMessageItem } from '~~/shared/schemas/support-chat'

export type ChatMessageItem = SupportMessageItem

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
      attachment_type?: 'image' | 'order_card' | 'product_card'
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

const messageContainer = ref<HTMLElement | null>(null)
const activeLightboxUrl = ref<string | null>(null)
const selectedOrder = ref<OrderPickerItem | null>(null)
const selectedProduct = ref<ProductPickerItem | null>(null)
const isOrderPickerOpen = ref(false)
const isProductPickerOpen = ref(false)

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

const handleComposerSend = async (payload: {
  message_text: string
  attachment_url?: string
  attachment_type?: 'image' | 'order_card' | 'product_card'
  attached_order_id?: string
  attached_product_id?: number
}) => {
  const capturedOrder = selectedOrder.value
  const capturedProduct = selectedProduct.value

  emit('sendMessage', payload)

  if (props.messages === undefined && supportChat) {
    const ok = await supportChat.sendMessage(payload)
    if (ok && (capturedOrder || capturedProduct)) {
      const msgs = supportChat.messages.value
      const last = msgs[msgs.length - 1] as ChatMessageItem | undefined
      if (last && last.sender_type === 'customer') {
        if (capturedOrder) last.attached_order = capturedOrder
        if (capturedProduct) last.attached_product = capturedProduct
      }
    }
  }

  selectedOrder.value = null
  selectedProduct.value = null
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

const uploadAttachmentProxy = async (file: File): Promise<string | null> => {
  if (!supportChat) return null
  return await supportChat.uploadAttachment(file)
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
      class="chat-header flex items-center justify-between rounded-t-2xl border-b border-brand-hair bg-brand-canvas px-4 py-3 shrink-0"
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
        <UiTooltip text="Kecilkan" position="top" align="end">
          <button
            type="button"
            class="btn-minimize flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
            aria-label="Kecilkan jendela chat"
            @click="emit('close')"
          >
            <i class="pi pi-minus text-xs" />
          </button>
        </UiTooltip>
        <UiTooltip text="Tutup Bantuan" position="top" align="end">
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

      <!-- Two-Row Composer Subcomponent -->
      <LiveChatComposer
        :is-sending="isSending"
        :is-uploading="isUploading"
        :selected-order="selectedOrder"
        :selected-product="selectedProduct"
        :upload-attachment="uploadAttachmentProxy"
        @send="handleComposerSend"
        @open-order-picker="isOrderPickerOpen = true"
        @open-product-picker="isProductPickerOpen = true"
        @clear-order="selectedOrder = null"
        @clear-product="selectedProduct = null"
      />
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
