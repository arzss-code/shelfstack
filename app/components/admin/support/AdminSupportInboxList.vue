<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  formatStatusLabel,
  statusDotClass,
  statusPillClass,
  statusDescription,
  formatRelativeTime,
  getInitials,
} from '~/utils/support-status'

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

const isDropdownOpen = ref(false)

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

const activeTabLabel = computed(() => {
  const found = tabs.find((t) => t.key === effectiveFilterStatus.value)
  return found?.label || 'Semua Percakapan'
})

const onSelectThread = (threadId: string) => {
  emit('selectThread', threadId)
  if (props.threads === undefined && adminChat) {
    adminChat.selectThread(threadId)
  }
}

const onSelectTab = (statusKey: string) => {
  emit('updateFilter', statusKey)
  isDropdownOpen.value = false
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
</script>

<template>
  <div
    class="admin-support-inbox-list flex h-full flex-col border-r border-brand-hair bg-brand-canvas"
  >
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
          class="search-input w-full rounded-field border border-brand-hair bg-brand-canvas-soft pl-8 pr-3 py-1.5 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-brand-canvas focus:outline-none transition-colors"
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Status Filter Dropdown Section (Replaces cramped text tabs) -->
    <div class="filter-section relative border-b border-brand-hair bg-brand-canvas-soft/30 p-2.5">
      <button
        type="button"
        class="filter-dropdown-trigger flex w-full items-center justify-between rounded-field border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs text-brand-ink shadow-xs transition-colors hover:border-brand-ink focus:outline-none cursor-pointer"
        aria-label="Filter status percakapan"
        @click="isDropdownOpen = !isDropdownOpen"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-brand-muted text-[11px] font-medium shrink-0">Filter:</span>
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="statusDotClass(effectiveFilterStatus)"
          />
          <span class="truncate font-semibold text-brand-ink">
            {{ activeTabLabel }}
          </span>
        </div>
        <i
          class="pi pi-chevron-down text-[10px] text-brand-muted transition-transform duration-200"
          :class="isDropdownOpen ? 'rotate-180' : ''"
        />
      </button>

      <!-- Dropdown Popover Menu with Test Contracts Preserved -->
      <div
        v-show="isDropdownOpen"
        class="status-tabs filter-menu absolute left-2.5 right-2.5 top-[calc(100%+4px)] z-30 rounded-card border border-brand-hair bg-brand-canvas p-1.5 shadow-floating space-y-0.5"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :data-status="tab.key"
          class="tab-btn filter-tab flex w-full items-center justify-between rounded-field px-2.5 py-2 text-xs transition-colors text-left cursor-pointer"
          :class="
            effectiveFilterStatus === tab.key
              ? 'active-tab bg-brand-canvas-soft font-semibold text-brand-ink'
              : 'text-brand-ink hover:bg-brand-canvas-soft/70'
          "
          @click="onSelectTab(tab.key)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2 w-2 shrink-0 rounded-full" :class="statusDotClass(tab.key)" />
            <span class="truncate">{{ tab.label }}</span>
          </div>
          <i
            v-if="effectiveFilterStatus === tab.key"
            class="pi pi-check text-[10px] text-brand-ink shrink-0"
          />
        </button>
      </div>
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
            ? 'active-thread is-active bg-brand-accent-tint/60 ring-1 ring-inset ring-brand-accent-edge'
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
            class="status-pill inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="statusPillClass(thread.status)"
            :data-status="thread.status"
            :title="statusDescription(thread.status)"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(thread.status)" />
            <span>{{ formatStatusLabel(thread.status) }}</span>
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
