<script setup lang="ts">
import { ref } from 'vue'
import type { OrderPickerItem } from './ChatOrderPickerModal.vue'
import type { ProductPickerItem } from './ChatProductPickerModal.vue'
import ChatEmojiPicker from './ChatEmojiPicker.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'

interface Props {
  isSending?: boolean
  isUploading?: boolean
  selectedOrder?: OrderPickerItem | null
  selectedProduct?: ProductPickerItem | null
  uploadAttachment?: (file: File) => Promise<string | null>
}

const props = withDefaults(defineProps<Props>(), {
  isSending: false,
  isUploading: false,
  selectedOrder: null,
  selectedProduct: null,
  uploadAttachment: undefined,
})

const emit = defineEmits<{
  send: [
    payload: {
      message_text: string
      attachment_url?: string
      attachment_type?: 'image' | 'order_card' | 'product_card'
      attached_order_id?: string
      attached_product_id?: number
    },
  ]
  openOrderPicker: []
  openProductPicker: []
  clearOrder: []
  clearProduct: []
}>()

const inputText = ref('')
const previewImage = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isEmojiOpen = ref(false)

const handleSend = () => {
  const text = inputText.value.trim()
  if (
    (!text && !props.selectedOrder && !props.selectedProduct) ||
    inputText.value.length > 1000 ||
    props.isSending
  ) {
    return
  }

  const payload: {
    message_text: string
    attachment_url?: string
    attachment_type?: 'image' | 'order_card' | 'product_card'
    attached_order_id?: string
    attached_product_id?: number
  } = {
    message_text:
      text ||
      (props.selectedOrder
        ? `Lampiran Pesanan #${props.selectedOrder.order_number || props.selectedOrder.id.slice(0, 8)}`
        : `Lampiran Produk ${props.selectedProduct?.title}`),
  }

  if (previewImage.value) {
    payload.attachment_url = previewImage.value
    payload.attachment_type = 'image'
  } else if (props.selectedOrder) {
    payload.attached_order_id = props.selectedOrder.id
    payload.attachment_type = 'order_card'
  } else if (props.selectedProduct) {
    payload.attached_product_id = props.selectedProduct.id
    payload.attachment_type = 'product_card'
  }

  emit('send', payload)

  inputText.value = ''
  previewImage.value = null
  uploadError.value = null
  isEmojiOpen.value = false
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

  if (props.uploadAttachment) {
    const url = await props.uploadAttachment(file)
    if (url) {
      previewImage.value = url
    } else {
      uploadError.value = 'Gagal mengunggah foto lampiran.'
      previewImage.value = null
    }
  }
  if (target) target.value = ''
}
</script>

<template>
  <div class="live-chat-composer-root shrink-0">
    <!-- Attachment Staging Drawer -->
    <div
      v-if="previewImage || selectedOrder || selectedProduct || uploadError"
      class="border-t border-brand-hair bg-brand-canvas-soft px-3 py-2 flex items-center justify-between text-xs"
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
          aria-label="Batalkan foto"
          @click="previewImage = null"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <div v-else-if="selectedOrder" class="flex items-center gap-2">
        <i class="pi pi-receipt text-xs text-brand-accent" />
        <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[170px]">
          {{ selectedOrder.order_number || selectedOrder.id.slice(0, 8) }}
        </span>
        <button
          type="button"
          class="text-brand-muted hover:text-brand-ink text-xs p-1"
          aria-label="Batalkan pesanan terlampir"
          @click="emit('clearOrder')"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <div v-else-if="selectedProduct" class="flex items-center gap-2">
        <i class="pi pi-box text-xs text-brand-accent" />
        <span class="text-[11px] font-semibold text-brand-ink truncate max-w-[170px]">
          {{ selectedProduct.title }}
        </span>
        <button
          type="button"
          class="text-brand-muted hover:text-brand-ink text-xs p-1"
          aria-label="Batalkan produk terlampir"
          @click="emit('clearProduct')"
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
    <div class="composer border-t border-brand-hair bg-white p-3 space-y-2">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Row 1: Full-width Textarea -->
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
        <!-- Left: Action Tooltips & Buttons -->
        <div class="flex items-center gap-1">
          <UiTooltip text="Lampirkan Foto" position="top" align="start">
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
              @click="emit('openOrderPicker')"
            >
              <i class="pi pi-receipt text-sm" />
            </button>
          </UiTooltip>

          <UiTooltip text="Lampirkan Produk" position="top">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-field text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink transition-colors"
              aria-label="Lampirkan produk"
              @click="emit('openProductPicker')"
            >
              <i class="pi pi-box text-sm" />
            </button>
          </UiTooltip>
        </div>

        <!-- Right: Counter & Send Button -->
        <div class="flex items-center gap-2">
          <span class="char-counter text-[10px] text-brand-muted tabular-nums">
            {{ inputText.length }}/1000
          </span>
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
</template>
