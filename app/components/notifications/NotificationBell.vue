<template>
  <div ref="bellRef" class="relative">
    <!-- Bell Button -->
    <UiTooltip text="Notifikasi" position="bottom" align="center">
      <button
        type="button"
        class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 cursor-pointer"
        aria-label="Lihat Notifikasi"
        :aria-expanded="isOpen"
        @click="toggleDropdown"
      >
        <i class="pi pi-bell text-base sm:text-lg text-brand-ink" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 h-4 sm:min-w-[17px] sm:h-[17px] px-1 rounded-full bg-brand-ink text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums shadow-xs leading-none"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </UiTooltip>

    <!-- Dropdown Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-brand-canvas border border-brand-hair rounded-card shadow-floating z-50 overflow-hidden flex flex-col"
        role="dialog"
        aria-label="Daftar Notifikasi"
      >
        <!-- Header -->
        <div
          class="px-4 py-3 border-b border-brand-hairsoft flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2">
            <h3 class="text-xs sm:text-sm font-bold text-brand-ink m-0">Notifikasi</h3>
            <span
              v-if="unreadCount > 0"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-brand-canvas-soft text-brand-ink border border-brand-hair rounded-full tabular-nums"
            >
              {{ unreadCount }} baru
            </span>
          </div>

          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-[11px] font-medium text-brand-muted hover:text-brand-ink transition-colors cursor-pointer bg-transparent border-0 p-0"
            @click="notificationStore.markAllAsRead"
          >
            Tandai semua dibaca
          </button>
        </div>

        <!-- Filter Tabs -->
        <div
          class="px-4 pt-2 pb-1 border-b border-brand-hairsoft flex items-center gap-2 bg-brand-canvas-soft/40"
        >
          <button
            type="button"
            class="px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer border-0"
            :class="
              activeTab === 'all'
                ? 'bg-brand-ink text-white'
                : 'bg-transparent text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
            "
            @click="activeTab = 'all'"
          >
            Semua ({{ items.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer border-0 flex items-center gap-1"
            :class="
              activeTab === 'unread'
                ? 'bg-brand-ink text-white'
                : 'bg-transparent text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
            "
            @click="activeTab = 'unread'"
          >
            <span>Belum Dibaca</span>
            <span
              v-if="unreadCount > 0"
              class="w-1.5 h-1.5 rounded-full"
              :class="activeTab === 'unread' ? 'bg-white' : 'bg-blue-600'"
            />
          </button>
        </div>

        <!-- Notification List -->
        <div class="max-h-[380px] overflow-y-auto divide-y divide-brand-hairsoft">
          <!-- Loading State -->
          <div v-if="isLoading" class="p-6 text-center text-xs text-brand-muted">
            <i class="pi pi-spin pi-spinner text-base mb-1 block" />
            Memuat notifikasi...
          </div>

          <!-- Empty State -->
          <div
            v-else-if="filteredItems.length === 0"
            class="px-6 py-10 text-center flex flex-col items-center justify-center gap-2"
          >
            <div
              class="w-10 h-10 rounded-full bg-brand-canvas-soft flex items-center justify-center text-brand-faint"
            >
              <i class="pi pi-bell-slash text-lg" />
            </div>
            <p class="text-xs font-semibold text-brand-ink m-0">
              {{
                activeTab === 'unread'
                  ? 'Semua notifikasi sudah dibaca'
                  : 'Belum ada notifikasi baru'
              }}
            </p>
            <p class="text-[11px] text-brand-muted m-0 max-w-[240px]">
              {{
                activeTab === 'unread'
                  ? 'Periksa tab Semua untuk melihat riwayat notifikasi sebelumnya.'
                  : 'Pembaruan pesanan, pembayaran, dan informasi akun akan tampil di sini.'
              }}
            </p>
          </div>

          <!-- List Items -->
          <button
            v-for="item in filteredItems"
            :key="item.id"
            type="button"
            class="w-full text-left p-3.5 sm:p-4 hover:bg-brand-canvas-soft transition-colors flex items-start gap-3 cursor-pointer bg-transparent border-0 relative group"
            :class="{ 'bg-blue-50/20': !item.is_read }"
            @click="handleNotificationClick(item)"
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
        </div>

        <!-- Footer / Link to Orders -->
        <div class="p-2 border-t border-brand-hairsoft bg-brand-canvas-soft/30 text-center">
          <NuxtLink
            to="/orders"
            class="text-[11px] font-semibold text-brand-ink hover:underline no-underline block py-1"
            @click="closeDropdown"
          >
            Lihat Semua Pesanan Saya <i class="pi pi-arrow-right text-[9px] ml-1" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { NotificationItem, NotificationType } from '../../../shared/schemas/notification'
import { useNotificationStore } from '~/features/notifications/stores/notifications'

const notificationStore = useNotificationStore()
const { items, unreadCount, isLoading, isOpen } = storeToRefs(notificationStore)

const activeTab = ref<'all' | 'unread'>('all')
const bellRef = ref<HTMLElement | null>(null)

const filteredItems = computed<NotificationItem[]>(() => {
  if (activeTab.value === 'unread') {
    return items.value.filter((item: NotificationItem) => !item.is_read)
  }
  return items.value
})

const toggleDropdown = () => {
  if (!isOpen.value) {
    notificationStore.fetchNotifications()
  }
  notificationStore.toggleDropdown()
}

const closeDropdown = () => {
  notificationStore.closeDropdown()
}

const handleNotificationClick = async (item: NotificationItem) => {
  if (!item.is_read) {
    await notificationStore.markAsRead(item.id)
  }
  closeDropdown()
  if (item.reference_url) {
    await navigateTo(item.reference_url)
  }
}

// Icon mapper
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

// Color/style mapper
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

// Relative time formatter
const formatTime = (isoString: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Baru saja'

    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} mnt lalu`

    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} jam lalu`

    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} hr lalu`

    const date = new Date(isoString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

// Click outside and escape handling
function handleClickOutside(event: MouseEvent) {
  if (!isOpen.value) return
  const target = event.target as Node | null
  if (bellRef.value && target && !bellRef.value.contains(target)) {
    closeDropdown()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('pointerdown', handleClickOutside, { passive: true })
    document.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('pointerdown', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>
