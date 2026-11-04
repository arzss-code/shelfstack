<script setup lang="ts">
import { computed } from 'vue'

export interface SupportThreadListItem {
  id: string
  customer_name: string
  customer_email: string
  status: string
  last_message_text: string | null
  last_message_at: string | null
  unread_by_admin_count: number
  customer_avatar_url?: string | null
  total_orders?: number
}

interface Props {
  threads?: SupportThreadListItem[]
  activeThreadId?: string | null
  filterStatus?: string
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  threads: undefined,
  activeThreadId: null,
  filterStatus: 'all',
  searchQuery: '',
})

const emit = defineEmits<{
  selectThread: [threadId: string]
  updateFilter: [status: string]
  updateSearch: [query: string]
}>()

interface AdminSupportChatComposable {
  threads: { value: SupportThreadListItem[] }
  activeThreadId: { value: string | null }
  activeFilter: { value: string }
  searchQuery: { value: string }
  selectThread: (id: string) => Promise<void>
  fetchThreads: () => Promise<void>
}

let adminChat: AdminSupportChatComposable | null = null
try {
  if (typeof useAdminSupportChat === 'function') {
    adminChat = useAdminSupportChat() as unknown as AdminSupportChatComposable
  }
} catch {
  // Graceful fallback for isolated unit tests
}

const tabs = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Baru' },
  { key: 'waiting_admin', label: 'Menunggu Balasan' },
  { key: 'waiting_customer', label: 'Menunggu Pelanggan' },
  { key: 'resolved', label: 'Selesai' },
]

const effectiveThreads = computed<SupportThreadListItem[]>(() => {
  if (props.threads !== undefined) return props.threads
  return adminChat?.threads?.value ?? []
})

const effectiveActiveThreadId = computed<string | null>(() => {
  if (props.activeThreadId !== null) return props.activeThreadId
  return adminChat?.activeThreadId?.value ?? null
})

const effectiveFilterStatus = computed<string>(() => {
  if (props.filterStatus !== 'all' || props.threads !== undefined) return props.filterStatus
  return adminChat?.activeFilter?.value ?? 'all'
})

const effectiveSearchQuery = computed<string>(() => {
  if (props.searchQuery !== '' || props.threads !== undefined) return props.searchQuery
  return adminChat?.searchQuery?.value ?? ''
})

const onSelectThread = (threadId: string) => {
  emit('selectThread', threadId)
  if (props.threads === undefined && adminChat) {
    adminChat.selectThread(threadId)
  }
}

const onSelectTab = (statusKey: string) => {
  emit('updateFilter', statusKey)
  if (props.threads === undefined && adminChat) {
    adminChat.activeFilter.value = statusKey
    adminChat.fetchThreads()
  }
}

const onSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = target.value
  emit('updateSearch', val)
  if (props.threads === undefined && adminChat) {
    adminChat.searchQuery.value = val
    adminChat.fetchThreads()
  }
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const formatRelativeTime = (isoString?: string | null): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Baru saja'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}j`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay}h`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

const statusPillClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-sky-50 text-sky-700 border border-sky-200'
    case 'waiting_admin':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'waiting_customer':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'resolved':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    default:
      return 'bg-brand-canvas-soft text-brand-muted border border-brand-hair'
  }
}
</script>

<template>
  <div class="admin-support-inbox-list flex h-full flex-col border-r border-brand-hair bg-white">
    <!-- Search Bar with Icon -->
    <div class="border-b border-brand-hair p-3">
      <div class="relative">
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted pointer-events-none"
        />
        <input
          type="text"
          :value="effectiveSearchQuery"
          placeholder="Cari nama atau email..."
          class="search-input w-full rounded-field border border-brand-hair bg-brand-canvas-soft pl-8 pr-3 py-1.5 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors"
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Status Tabs -->
    <div
      class="status-tabs flex overflow-x-auto border-b border-brand-hair text-xs scrollbar-none bg-brand-canvas-soft/30 px-1"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :data-status="tab.key"
        class="tab-btn filter-tab px-3 py-2.5 font-medium whitespace-nowrap transition-colors border-b-2"
        :class="
          effectiveFilterStatus === tab.key
            ? 'active-tab border-brand-ink text-brand-ink font-semibold'
            : 'border-transparent text-brand-muted hover:text-brand-ink'
        "
        @click="onSelectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Thread Cards List -->
    <div class="thread-items flex-1 overflow-y-auto divide-y divide-brand-hair/60">
      <div
        v-if="effectiveThreads.length === 0"
        class="empty-inbox p-8 text-center text-xs text-brand-muted flex flex-col items-center justify-center gap-2"
      >
        <i class="pi pi-inbox text-2xl text-brand-hair" />
        <span>Tidak ada pesan bantuan ditemukan</span>
      </div>

      <div
        v-for="thread in effectiveThreads"
        :key="thread.id"
        :data-id="thread.id"
        class="thread-card thread-item flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-brand-canvas-soft/80"
        :class="[
          effectiveActiveThreadId === thread.id
            ? 'active-thread is-active bg-brand-canvas-soft border-l-4 border-l-brand-ink pl-2.5'
            : '',
        ]"
        @click="onSelectThread(thread.id)"
      >
        <div class="flex flex-1 items-center gap-2.5 min-w-0 mr-2">
          <!-- Avatar -->
          <div
            class="customer-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-xs font-semibold text-brand-ink overflow-hidden shadow-xs"
          >
            <img
              v-if="thread.customer_avatar_url"
              :src="thread.customer_avatar_url"
              :alt="thread.customer_name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ getInitials(thread.customer_name) }}</span>
          </div>

          <!-- Customer details & last snippet -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="customer-name truncate text-xs font-semibold text-brand-ink">
                {{ thread.customer_name }}
              </span>
              <span class="shrink-0 text-[10px] text-brand-muted tabular-nums">
                {{ formatRelativeTime(thread.last_message_at) }}
              </span>
            </div>
            <div class="last-message last-message-snippet truncate text-xs text-brand-muted mt-0.5">
              {{ thread.last_message_text || 'Belum ada pesan' }}
            </div>
          </div>
        </div>

        <!-- Status pill & unread badge -->
        <div class="flex shrink-0 flex-col items-end gap-1.5">
          <span
            class="status-pill rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="statusPillClass(thread.status)"
            :data-status="thread.status"
          >
            {{ thread.status }}
          </span>
          <span
            v-if="thread.unread_by_admin_count > 0"
            class="unread-admin-badge unread-badge flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs"
          >
            {{ thread.unread_by_admin_count }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
