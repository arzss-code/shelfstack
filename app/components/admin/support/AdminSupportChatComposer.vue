<script setup lang="ts">
import { ref } from 'vue'
import AdminCannedResponseMenu from './AdminCannedResponseMenu.vue'
import ChatEmojiPicker from '~/components/support/ChatEmojiPicker.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'

interface Props {
  isSending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSending: false,
})

const emit = defineEmits<{
  send: [payload: { message_text: string; attachment_url?: string }]
  openProductPicker: []
}>()

const replyText = ref('')
const isCannedOpen = ref(false)
const isEmojiOpen = ref(false)
const selectedImage = ref<string | null>(null)
const imageFileInput = ref<HTMLInputElement | null>(null)

const toggleCannedMenu = () => {
  isCannedOpen.value = !isCannedOpen.value
  isEmojiOpen.value = false
}

const toggleEmojiPicker = () => {
  isEmojiOpen.value = !isEmojiOpen.value
  isCannedOpen.value = false
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

const handleSend = () => {
  const text = replyText.value.trim()
  if (!text || props.isSending) return

  const payload: { message_text: string; attachment_url?: string } = {
    message_text: text,
  }
  if (selectedImage.value) {
    payload.attachment_url = selectedImage.value
  }

  emit('send', payload)
  replyText.value = ''
  selectedImage.value = null
  isCannedOpen.value = false
  isEmojiOpen.value = false
}

const appendText = (text: string) => {
  replyText.value = replyText.value ? `${replyText.value}\n${text}` : text
}

defineExpose({
  appendText,
})
</script>

<template>
  <div
    class="admin-support-chat-composer relative border-t border-brand-hair bg-white p-3 shrink-0"
  >
    <!-- Canned Response Picker Popover -->
    <div v-if="isCannedOpen" class="absolute bottom-24 left-3 z-30">
      <AdminCannedResponseMenu @select="onCannedSelect" @select-response="onCannedSelect" />
    </div>

    <!-- Emoji Picker Popover -->
    <div v-if="isEmojiOpen" class="absolute bottom-24 left-32 z-30">
      <ChatEmojiPicker @select-emoji="onEmojiSelect" @close="isEmojiOpen = false" />
    </div>

    <!-- Hidden File Input for Image Upload -->
    <input
      ref="imageFileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onImageSelected"
    />

    <!-- Attachment Preview Drawer -->
    <div
      v-if="selectedImage"
      class="mb-2 flex items-center gap-3 rounded-field border border-brand-hair bg-brand-canvas-soft/70 px-3 py-1.5"
    >
      <div class="relative inline-block">
        <img
          :src="selectedImage"
          alt="Preview upload"
          class="h-10 w-10 rounded-field border border-brand-hair object-cover shadow-xs"
        />
        <button
          type="button"
          class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-ink text-[8px] text-white hover:bg-red-600 transition-colors"
          @click="selectedImage = null"
        >
          <i class="pi pi-times" />
        </button>
      </div>
      <span class="text-xs text-brand-muted">Foto siap dilampirkan bersama pesan balasan</span>
    </div>

    <!-- Two-Row Spacious Composer -->
    <div class="pane-composer space-y-2">
      <!-- Row 1: Full-width Textarea -->
      <textarea
        v-model="replyText"
        rows="2"
        maxlength="1000"
        placeholder="Ketik balasan untuk pelanggan..."
        class="composer-textarea composer-input w-full resize-none rounded-field border border-brand-hair bg-brand-canvas-soft px-3 py-2 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors leading-relaxed"
        @keydown.enter.exact.prevent="handleSend"
      />

      <!-- Row 2: Action Toolbar & Send Button -->
      <div class="flex items-center justify-between gap-2 pt-0.5">
        <!-- Left: Action Tools with UiTooltip -->
        <div class="flex items-center gap-1.5">
          <!-- Canned Responses Trigger -->
          <UiTooltip text="Gunakan Template Balasan Cepat" position="top" align="start">
            <button
              type="button"
              class="btn-canned inline-flex h-8 items-center gap-1.5 rounded-field border border-brand-hair bg-brand-canvas-soft px-2.5 text-xs font-medium text-brand-ink hover:bg-white hover:border-brand-ink transition-colors"
              @click="toggleCannedMenu"
            >
              <i class="pi pi-bolt text-xs text-brand-accent" />
              <span>Pesan Cepat</span>
            </button>
          </UiTooltip>

          <!-- Emoji Trigger -->
          <UiTooltip text="Pilih Emotikon" position="top">
            <button
              type="button"
              class="btn-emoji flex h-8 w-8 items-center justify-center rounded-field border border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
              aria-label="Tambah emotikon"
              @click="toggleEmojiPicker"
            >
              <i class="pi pi-face-smile text-xs" />
            </button>
          </UiTooltip>

          <!-- Image Attach Trigger -->
          <UiTooltip text="Lampirkan Gambar" position="top">
            <button
              type="button"
              class="btn-attach-image flex h-8 w-8 items-center justify-center rounded-field border border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
              aria-label="Lampirkan gambar"
              @click="imageFileInput?.click()"
            >
              <i class="pi pi-image text-xs" />
            </button>
          </UiTooltip>

          <!-- Recommend Product Trigger -->
          <UiTooltip text="Rekomendasikan Produk Katalog" position="top">
            <button
              type="button"
              class="btn-attach-product flex h-8 w-8 items-center justify-center rounded-field border border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
              aria-label="Rekomendasikan produk"
              @click="emit('openProductPicker')"
            >
              <i class="pi pi-box text-xs" />
            </button>
          </UiTooltip>
        </div>

        <!-- Right: Counter & Send Button -->
        <div class="flex items-center gap-2">
          <span class="char-counter text-[10px] text-brand-muted tabular-nums"
            >{{ replyText.length }}/1000</span
          >
          <button
            type="button"
            class="btn-admin-send btn-send inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-inkhover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!replyText.trim() || isSending"
            @click="handleSend"
          >
            <i class="pi pi-send text-[10px]" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
