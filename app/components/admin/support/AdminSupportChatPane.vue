<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import AdminSupportChatHeader from './AdminSupportChatHeader.vue'
import AdminCannedResponseMenu from './AdminCannedResponseMenu.vue'
import ChatEmojiPicker from '~/components/support/ChatEmojiPicker.vue'
import ChatOrderSnippet from '~/components/support/ChatOrderSnippet.vue'
import ChatProductSnippet from '~/components/support/ChatProductSnippet.vue'
import ChatLightboxModal from '~/components/support/ChatLightboxModal.vue'

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
  attached_order?: any | null
  attached_product?: any | null
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
  // Composable fallback in unit testing environments
}

const replyText = ref('')
const isCannedOpen = ref(false)
const isEmojiOpen = ref(false)
const selectedImage = ref<string | null>(null)
const imageFileInput = ref<HTMLInputElement | null>(null)
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

  const payload: { message_text: string; attachment_url?: string } = { message_text: text }
  if (selectedImage.value) payload.attachment_url = selectedImage.value

  emit('sendMessage', payload)
  if (props.thread === undefined && adminChat) {
    await adminChat.sendAdminMessage(payload)
  }

  replyText.value = ''
  selectedImage.value = null
  isCannedOpen.value = false
  isEmojiOpen.value = false
  scrollToBottom()
}

const onUpdateStatus = async (newStatus: string) => {
  emit('updateStatus', newStatus)
  if (props.thread === undefined && adminChat && effectiveThread.value?.id) {
    await adminChat.updateStatus(newStatus)
  }
}

const onCannedSelect = (text: string) => {
  replyText.value = text
  isCannedOpen.value = false
}
const onEmojiSelect = (emoji: string) => {
  replyText.value += emoji
  isEmojiOpen.value = false
}

const onImageSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    selectedImage.value = event.target?.result as string
  }
  reader.readAsDataURL(file)
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
          <!-- System Note -->
          <div
            v-if="msg.sender_type === 'system'"
            class="message-bubble system-bubble mx-auto max-w-[85%] rounded-full border border-brand-hairsoft bg-white/80 backdrop-blur-xs px-3.5 py-1 text-center text-[11px] text-brand-muted shadow-xs"
          >
            <p class="text-xs m-0">{{ msg.message_text }}</p>
          </div>

          <!-- Customer Message (Left) -->
          <div
            v-else-if="msg.sender_type === 'customer'"
            class="message-bubble customer-bubble mr-auto max-w-[80%] rounded-2xl rounded-bl-xs border border-brand-hair bg-white p-3 text-brand-ink shadow-whisper space-y-2"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-2 max-w-xs max-h-48 rounded-field border border-brand-hair object-cover cursor-pointer hover:opacity-95 shadow-xs"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <ChatOrderSnippet v-if="msg.attached_order" :order="msg.attached_order" />
            <ChatProductSnippet v-if="msg.attached_product" :product="msg.attached_product" />
            <div class="flex items-center justify-end text-[10px] text-brand-muted tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>

          <!-- Admin Message (Right) -->
          <div
            v-else
            class="message-bubble admin-bubble ml-auto max-w-[80%] rounded-2xl rounded-br-xs bg-brand-ink text-white p-3 shadow-whisper space-y-2"
          >
            <p class="text-xs m-0 leading-relaxed whitespace-pre-wrap">{{ msg.message_text }}</p>
            <img
              v-if="msg.attachment_url"
              :src="msg.attachment_url"
              alt="Lampiran"
              class="attachment-preview mt-2 max-w-xs max-h-48 rounded-field object-cover cursor-pointer hover:opacity-95 shadow-xs"
              @click="activeLightboxUrl = msg.attachment_url"
            />
            <div class="flex items-center justify-end text-[10px] text-white/60 tabular-nums">
              <span>{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Attachment Preview Drawer -->
      <div
        v-if="selectedImage"
        class="border-t border-brand-hair bg-brand-canvas-soft/70 px-4 py-2 flex items-center gap-3 shrink-0"
      >
        <div class="relative inline-block">
          <img
            :src="selectedImage"
            alt="Preview upload"
            class="h-14 w-14 object-cover rounded-field border border-brand-hair shadow-xs"
          />
          <button
            type="button"
            class="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-brand-ink text-white flex items-center justify-center text-[8px] hover:bg-red-600 transition-colors"
            @click="selectedImage = null"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <span class="text-xs text-brand-muted">Foto siap dilampirkan</span>
      </div>

      <!-- Composer Bar -->
      <div class="pane-composer relative border-t border-brand-hair bg-white p-3 shrink-0">
        <!-- Canned Response Picker Popover -->
        <div v-if="isCannedOpen" class="absolute bottom-16 left-3 z-30">
          <AdminCannedResponseMenu @select="onCannedSelect" @select-response="onCannedSelect" />
        </div>

        <!-- Emoji Picker Popover -->
        <div v-if="isEmojiOpen" class="absolute bottom-16 left-28 z-30">
          <ChatEmojiPicker @select-emoji="onEmojiSelect" @close="isEmojiOpen = false" />
        </div>

        <input
          ref="imageFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onImageSelected"
        />

        <div class="flex items-center gap-1.5">
          <!-- Canned Responses Trigger -->
          <button
            type="button"
            class="btn-canned inline-flex items-center gap-1 rounded-field border border-brand-hair bg-brand-canvas-soft px-2.5 py-1.5 text-xs font-medium text-brand-ink hover:bg-white hover:border-brand-ink transition-colors"
            @click="
              isCannedOpen = !isCannedOpen
              isEmojiOpen = false
            "
          >
            <i class="pi pi-bolt text-xs text-brand-accent" />
            <span>Pesan Cepat</span>
          </button>

          <!-- Emoji Trigger -->
          <button
            type="button"
            class="btn-emoji flex h-7 w-7 items-center justify-center rounded-field border border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
            title="Tambah Emotikon"
            @click="
              isEmojiOpen = !isEmojiOpen
              isCannedOpen = false
            "
          >
            <i class="pi pi-face-smile text-xs" />
          </button>

          <!-- Image Attach Trigger -->
          <button
            type="button"
            class="btn-attach-image flex h-7 w-7 items-center justify-center rounded-field border border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
            title="Lampirkan Gambar"
            @click="imageFileInput?.click()"
          >
            <i class="pi pi-image text-xs" />
          </button>

          <!-- Composer Textarea -->
          <textarea
            v-model="replyText"
            rows="1"
            maxlength="1000"
            placeholder="Ketik balasan untuk pelanggan..."
            class="composer-textarea composer-input flex-1 resize-none rounded-field border border-brand-hair bg-brand-canvas-soft px-3 py-1.5 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors"
            @keydown.enter.exact.prevent="handleSend"
          />

          <!-- Character Counter -->
          <span class="char-counter shrink-0 text-[10px] text-brand-muted tabular-nums"
            >{{ replyText.length }}/1000</span
          >

          <!-- Send Action Button -->
          <button
            type="button"
            class="btn-admin-send btn-send inline-flex items-center gap-1.5 rounded-field bg-brand-ink px-3.5 py-1.5 text-xs text-white font-medium hover:bg-brand-inkhover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
            :disabled="!replyText.trim() || isSending"
            @click="handleSend"
          >
            <i class="pi pi-send text-[10px]" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal Overlay -->
    <ChatLightboxModal :image-url="activeLightboxUrl" @close="activeLightboxUrl = null" />
  </div>
</template>
