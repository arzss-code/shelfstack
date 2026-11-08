<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import AdminSupportChatHeader from './AdminSupportChatHeader.vue'
import AdminSupportChatComposer from './AdminSupportChatComposer.vue'
import ChatOrderSnippet, { type ChatOrderData } from '~/components/support/ChatOrderSnippet.vue'
import ChatProductSnippet, {
  type ChatProductData,
} from '~/components/support/ChatProductSnippet.vue'
import ChatLightboxModal from '~/components/support/ChatLightboxModal.vue'
import ChatProductPickerModal from '~/components/support/ChatProductPickerModal.vue'

export interface SupportThreadCustomer {
  id: string
  customer_name: string
  customer_email: string
  status: string
  total_orders?: number
  customer_avatar_url?: string | null
  attached_order_id?: string | null
  attached_product_id?: number | null
}

export interface SupportPaneMessage {
  id: string
  sender_type: 'customer' | 'admin' | 'system'
  message_text: string
  created_at: string
  attachment_url?: string | null
  attachment_type?: string | null
  attached_order?: ChatOrderData | null
  attached_product?: ChatProductData | null
}

interface Props {
  thread?: SupportThreadCustomer | null
  messages?: SupportPaneMessage[]
}

const props = withDefaults(defineProps<Props>(), { thread: undefined, messages: undefined })

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
  // Composable fallback in unit testing environments
}

const composerRef = ref<InstanceType<typeof AdminSupportChatComposer> | null>(null)
const isProductPickerOpen = ref(false)
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

const handleComposerSend = async (payload: { message_text: string; attachment_url?: string }) => {
  emit('sendMessage', payload)
  if (props.thread === undefined && adminChat) {
    await adminChat.sendAdminMessage(payload)
  }
  scrollToBottom()
}

const onUpdateStatus = async (newStatus: string) => {
  emit('updateStatus', newStatus)
  if (props.thread === undefined && adminChat && effectiveThread.value?.id) {
    await adminChat.updateStatus(newStatus)
  }
}

const onProductSelect = (product: { id: number; title: string; price_cents: number }) => {
  const rupiah = Math.round(product.price_cents / 100).toLocaleString('id-ID')
  const rec = `Rekomendasi Produk: ${product.title} (Rp ${rupiah}) - /products/${product.id}`
  if (composerRef.value) {
    composerRef.value.appendText(rec)
  }
  isProductPickerOpen.value = false
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
  <div class="admin-support-chat-pane flex h-full flex-col bg-white">
    <!-- Empty State -->
    <div
      v-if="!effectiveThread"
      class="empty-pane flex flex-1 items-center justify-center p-8 text-center text-xs text-brand-muted h-full"
    >
      Pilih thread untuk memulai percakapan
    </div>

    <!-- Active Conversation View -->
    <div v-else class="active-pane flex flex-1 flex-col h-full min-h-0">
      <!-- Modular Header -->
      <AdminSupportChatHeader :thread="effectiveThread" @update-status="onUpdateStatus" />

      <!-- Message Stream -->
      <div
        ref="messageContainer"
        class="pane-messages flex-1 overflow-y-auto bg-brand-canvas-soft/40 p-4 space-y-3"
      >
        <template v-for="msg in effectiveMessages" :key="msg.id">
          <!-- System Note (Clean Informational Card instead of Oval Badge) -->
          <div
            v-if="msg.sender_type === 'system'"
            class="message-bubble system-bubble mx-auto my-2 max-w-[85%] rounded-xl border border-brand-hair bg-white p-3.5 text-center text-xs text-brand-muted leading-relaxed shadow-whisper"
          >
            {{ msg.message_text }}
          </div>

          <!-- Customer Message (Dynamic fit left) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="message-bubble customer-bubble mr-auto w-fit max-w-[80%] rounded-2xl rounded-bl-xs border border-brand-hair bg-white px-3.5 py-2.5 text-brand-ink shadow-whisper space-y-1.5"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-1 max-w-xs max-h-48 rounded-field border border-brand-hair object-cover cursor-pointer hover:opacity-95 shadow-xs"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
            <ChatProductSnippet v-if="msg.attached_product" :product="msg.attached_product" />
            <div class="flex items-center justify-end text-[10px] text-brand-muted tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>

          <!-- Admin Message (Dynamic fit right) -->
          <div
            v-else
            class="message-bubble admin-bubble ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-xs bg-brand-ink text-white px-3.5 py-2.5 shadow-whisper space-y-1.5"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap break-words">
              {{ msg.message_text }}
            </p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-1 max-w-xs max-h-48 rounded-field object-cover cursor-pointer hover:opacity-95 shadow-xs"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
            <ChatProductSnippet v-if="msg.attached_product" :product="msg.attached_product" />
            <div class="flex items-center justify-end text-[10px] text-white/70 tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Composer Subcomponent -->
      <AdminSupportChatComposer
        ref="composerRef"
        :is-sending="isSending"
        @send="handleComposerSend"
        @open-product-picker="isProductPickerOpen = true"
      />
    </div>

    <!-- Product Picker Modal -->
    <ChatProductPickerModal
      :is-open="isProductPickerOpen"
      @select-product="onProductSelect"
      @close="isProductPickerOpen = false"
    />

    <!-- Lightbox Modal Overlay -->
    <ChatLightboxModal :image-url="activeLightboxUrl" @close="activeLightboxUrl = null" />
  </div>
</template>
