<script setup lang="ts">
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

const onStatusChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  emit('updateStatus', val)
}
</script>

<template>
  <div
    class="pane-header flex items-center justify-between border-b border-brand-hair bg-brand-canvas px-4 py-3 shrink-0 shadow-xs"
  >
    <div class="flex items-center gap-3">
      <div
        class="customer-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-xs font-bold text-brand-ink overflow-hidden shadow-xs"
      >
        <img
          v-if="thread.customer_avatar_url"
          :src="thread.customer_avatar_url"
          :alt="thread.customer_name"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ getInitials(thread.customer_name) }}</span>
      </div>
      <div>
        <div class="customer-name text-sm font-bold text-brand-ink flex items-center gap-2">
          <span>{{ thread.customer_name }}</span>
        </div>
        <div class="customer-email text-xs text-brand-muted font-mono">
          {{ thread.customer_email }}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Status Badge with Dot Indicator & Tooltip Title -->
      <span
        class="status-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize cursor-help"
        :data-status="thread.status"
        :class="statusBadgeClass(thread.status)"
        :title="statusDescription(thread.status)"
        ><span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(thread.status)" />{{
          thread.status
        }}</span
      >

      <!-- Status Dropdown Wrapper -->
      <div class="relative">
        <select
          :value="thread.status"
          class="status-select appearance-none rounded-field border border-brand-hair bg-brand-canvas-soft pl-2.5 pr-7 py-1 text-xs font-medium text-brand-ink focus:border-brand-ink focus:bg-brand-canvas focus:outline-none transition-colors cursor-pointer"
          aria-label="Ubah status percakapan"
          @change="onStatusChange"
        >
          <option value="open">open (Baru)</option>
          <option value="waiting_admin">waiting_admin (Perlu Respon CS)</option>
          <option value="waiting_customer">waiting_customer (Menunggu Pelanggan)</option>
          <option value="resolved">resolved (Selesai)</option>
        </select>
        <i
          class="pi pi-chevron-down pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-brand-muted"
        />
      </div>

      <!-- 1-Click Resolve Button -->
      <button
        type="button"
        class="btn-resolve inline-flex items-center gap-1.5 rounded-field bg-brand-success hover:opacity-90 px-3 py-1 text-xs text-white font-medium shadow-xs transition-colors active:scale-95"
        @click="emit('updateStatus', 'resolved')"
      >
        <i class="pi pi-check text-[10px]" />
        <span>Selesaikan Tiket</span>
      </button>
    </div>
  </div>
</template>
