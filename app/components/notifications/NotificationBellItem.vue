<script setup lang="ts">
import type { NotificationItem, NotificationType } from '~~/shared/schemas/notification'

defineProps<{
  item: NotificationItem
  getTypeIcon: (type: NotificationType) => string
  getTypeStyles: (type: NotificationType) => string
  formatTime: (isoString: string) => string
}>()

const emit = defineEmits<{
  select: [item: NotificationItem]
}>()
</script>

<template>
  <button
    type="button"
    class="w-full text-left p-3.5 sm:p-4 hover:bg-brand-canvas-soft transition-colors flex items-start gap-3 cursor-pointer bg-transparent border-0 relative group"
    :class="{ 'bg-blue-50/20': !item.is_read }"
    @click="emit('select', item)"
  >
    <!-- Status Icon -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
      :class="getTypeStyles(item.type)"
    >
      <i :class="getTypeIcon(item.type)" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 pr-2">
      <div class="flex items-center justify-between gap-2 mb-0.5">
        <p
          class="text-xs font-semibold m-0 truncate"
          :class="item.is_read ? 'text-brand-ink' : 'text-brand-ink font-bold'"
        >
          {{ item.title }}
        </p>
        <span class="text-[10px] text-brand-faint shrink-0 tabular-nums">
          {{ formatTime(item.created_at) }}
        </span>
      </div>
      <p class="text-[11px] text-brand-muted m-0 line-clamp-2 leading-relaxed">
        {{ item.message }}
      </p>
    </div>

    <!-- Unread Dot Indicator -->
    <span
      v-if="!item.is_read"
      class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2.5"
      aria-label="Belum dibaca"
    />
  </button>
</template>
