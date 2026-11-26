<script setup lang="ts">
import UiSelect, { type UiSelectOption } from '~/components/ui/UiSelect.vue'

export interface SupportThreadCustomer {
  id: string
  customer_name: string
  customer_email: string
  status: string
  total_orders?: number
  customer_avatar_url?: string | null
}

interface Props {
  thread: SupportThreadCustomer
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateStatus: [newStatus: string]
}>()

const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-brand-accent-tint text-brand-accent-text border-brand-accent-edge'
    case 'waiting_admin':
      return 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge'
    case 'waiting_customer':
      return 'bg-brand-canvas-soft text-brand-muted border-brand-hair'
    case 'resolved':
      return 'bg-brand-success-tint text-brand-success-text border-brand-success-edge'
    default:
      return 'bg-brand-canvas-soft text-brand-muted border-brand-hair'
  }
}

const statusDotClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-brand-accent'
    case 'waiting_admin':
      return 'bg-brand-warning'
    case 'waiting_customer':
      return 'bg-brand-muted'
    case 'resolved':
      return 'bg-brand-success'
    default:
      return 'bg-brand-faint'
  }
}

const statusDescription = (status: string): string => {
  switch (status) {
    case 'open':
      return 'Tiket baru dibuat, menunggu respon awal.'
    case 'waiting_admin':
      return 'Pelanggan mengirim pesan, perlu tindakan/balasan CS.'
    case 'waiting_customer':
      return 'CS telah merespon, menunggu tindak lanjut pelanggan.'
    case 'resolved':
      return 'Kendala pelanggan telah terselesaikan.'
    default:
      return 'Status percakapan bantuan.'
  }
}

const statusOptions: UiSelectOption[] = [
  { value: 'open', label: 'Baru (open)' },
  { value: 'waiting_admin', label: 'Perlu Respon CS' },
  { value: 'waiting_customer', label: 'Menunggu Pelanggan' },
  { value: 'resolved', label: 'Selesai' },
]

const onStatusSelect = (val: string) => {
  emit('updateStatus', val)
}
</script>

<template>
  <div
    class="pane-header flex flex-wrap items-center justify-between gap-2 border-b border-brand-hair bg-brand-canvas px-3.5 py-2.5 shrink-0"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <div
        class="customer-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-xs font-bold text-brand-ink overflow-hidden"
      >
        <img
          v-if="thread.customer_avatar_url"
          :src="thread.customer_avatar_url"
          :alt="thread.customer_name"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ getInitials(thread.customer_name) }}</span>
      </div>
      <div class="min-w-0">
        <div
          class="customer-name text-sm font-bold text-brand-ink flex items-center gap-2 truncate"
        >
          <span class="truncate">{{ thread.customer_name }}</span>
        </div>
        <div class="customer-email text-[11px] text-brand-muted font-mono truncate">
          {{ thread.customer_email }}
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 shrink-0">
      <!-- Status Badge with Dot Indicator & Tooltip Title -->
      <span
        class="status-badge inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold capitalize cursor-help"
        :data-status="thread.status"
        :class="statusBadgeClass(thread.status)"
        :title="statusDescription(thread.status)"
        ><span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(thread.status)" />{{
          thread.status
        }}</span
      >

      <UiSelect
        :model-value="thread.status"
        :options="statusOptions"
        size="xs"
        :pill="false"
        align="right"
        select-class="status-select"
        aria-label="Ubah status percakapan"
        class="w-[168px]"
        @change="onStatusSelect"
      />

      <!-- 1-Click Resolve Button -->
      <button
        type="button"
        class="btn-resolve inline-flex h-8 items-center gap-1.5 rounded-field bg-brand-success hover:opacity-90 px-3 text-xs text-white font-semibold transition-all active:scale-95 cursor-pointer border-0 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
        @click="emit('updateStatus', 'resolved')"
      >
        <i class="pi pi-check text-[10px]" aria-hidden="true" />
        <span>Selesaikan Tiket</span>
      </button>
    </div>
  </div>
</template>
