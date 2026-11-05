<script setup lang="ts">
import type { NotificationItem, NotificationType } from '../../../shared/schemas/notification'

defineProps<{
  item: NotificationItem
}>()

defineEmits<{
  read: [id: string]
  navigate: [item: NotificationItem]
}>()

const getTypeIcon = (type: NotificationType): string => {
  switch (type) {
    case 'order_created':
      return 'pi pi-shopping-bag'
    case 'payment_success':
      return 'pi pi-check-circle'
    case 'order_shipped':
      return 'pi pi-truck'
    case 'order_completed':
      return 'pi pi-verified'
    case 'order_cancelled':
      return 'pi pi-times-circle'
    case 'system':
    default:
      return 'pi pi-info-circle'
  }
}

const getTypeStyles = (type: NotificationType): string => {
  switch (type) {
    case 'order_created':
      return 'bg-blue-100/70 text-blue-700'
    case 'payment_success':
      return 'bg-emerald-100/70 text-emerald-700'
    case 'order_shipped':
      return 'bg-amber-100/70 text-amber-700'
    case 'order_completed':
      return 'bg-purple-100/70 text-purple-700'
    case 'order_cancelled':
      return 'bg-rose-100/70 text-rose-700'
    case 'system':
    default:
      return 'bg-zinc-100 text-zinc-700'
  }
}

const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
</script>

<template>
  <div
    class="p-4 sm:p-5 hover:bg-brand-canvas-soft/60 transition-colors flex items-start gap-4"
    :class="{ 'bg-blue-50/20': !item.is_read }"
  >
    <!-- Type Icon -->
    <div
      class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base mt-0.5"
      :class="getTypeStyles(item.type)"
    >
      <i :class="getTypeIcon(item.type)" />
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
        <div class="flex items-center gap-2">
          <h4
            class="text-xs sm:text-sm m-0"
            :class="item.is_read ? 'text-brand-ink font-semibold' : 'text-brand-ink font-bold'"
          >
            {{ item.title }}
          </h4>
          <span
            v-if="!item.is_read"
            class="w-2 h-2 rounded-full bg-blue-600 shrink-0"
            title="Belum dibaca"
          />
        </div>
        <span class="text-[11px] text-brand-faint tabular-nums shrink-0">
          {{ formatDateTime(item.created_at) }}
        </span>
      </div>

      <p class="text-xs sm:text-sm text-brand-muted m-0 leading-relaxed">
        {{ item.message }}
      </p>

      <!-- Actions inside card -->
      <div class="flex items-center gap-3 mt-3">
        <NuxtLink
          v-if="item.reference_url"
          :to="item.reference_url"
          class="text-xs font-semibold text-brand-accent hover:underline no-underline inline-flex items-center gap-1"
          @click="$emit('navigate', item)"
        >
          <span>Buka Halaman Terkait</span>
          <i class="pi pi-arrow-right text-[10px]" />
        </NuxtLink>

        <button
          v-if="!item.is_read"
          type="button"
          class="text-xs text-brand-muted hover:text-brand-ink font-medium bg-transparent border-0 p-0 cursor-pointer"
          @click="$emit('read', item.id)"
        >
          Tandai dibaca
        </button>
      </div>
    </div>
  </div>
</template>
