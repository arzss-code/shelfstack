<script setup lang="ts">
const emit = defineEmits<{
  selectEmoji: [emoji: string]
  close: []
}>()

const emojis = [
  '😊',
  '👍',
  '🙏',
  '❤️',
  '👋',
  '🙌',
  '🤝',
  '😂',
  '📦',
  '🚚',
  '🛍️',
  '💳',
  '🛒',
  '🏷️',
  '✨',
  '🎉',
  '✅',
  '⏳',
  '⚠️',
  '❓',
  '💬',
  '📍',
  '⭐',
  '🔥',
]

const onSelect = (emoji: string) => {
  emit('selectEmoji', emoji)
}
</script>

<template>
  <div
    class="chat-emoji-picker w-64 rounded-card border border-brand-hair bg-brand-canvas p-2.5 shadow-floating z-40"
    role="dialog"
    aria-label="Pilih Emotikon"
  >
    <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-brand-hair">
      <span class="text-xs font-semibold text-brand-muted">Emotikon Cepat</span>
      <button
        type="button"
        class="text-brand-muted hover:text-brand-ink text-xs p-1"
        aria-label="Tutup pemilih emotikon"
        @click="emit('close')"
      >
        <i class="pi pi-times text-[10px]" />
      </button>
    </div>
    <div class="grid grid-cols-6 gap-1">
      <button
        v-for="emoji in emojis"
        :key="emoji"
        type="button"
        class="emoji-btn flex h-8 w-8 items-center justify-center rounded text-base hover:bg-brand-canvas-soft active:scale-95 transition-transform"
        @click="onSelect(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>
