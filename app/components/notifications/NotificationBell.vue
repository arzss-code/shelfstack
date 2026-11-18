<script setup lang="ts">
import NotificationBellItem from '~/components/notifications/NotificationBellItem.vue'
import { useNotificationBell } from '~/composables/useNotificationBell'

interface Props {
  variant?: 'dark' | 'light'
}

withDefaults(defineProps<Props>(), {
  variant: 'dark',
})

const {
  notificationStore,
  items,
  unreadCount,
  isLoading,
  isLoadingMore,
  hasMore,
  isOpen,
  desktopPermission,
  activeTab,
  bellRef,
  filteredItems,
  toggleDropdown,
  closeDropdown,
  handleRequestDesktop,
  handleNotificationClick,
  getTypeIcon,
  getTypeStyles,
  formatTime,
} = useNotificationBell()
</script>

<template>
  <div ref="bellRef" class="relative">
    <!-- Bell Button with Dynamic Variant (dark / light) -->
    <UiTooltip text="Notifikasi" position="bottom" align="center">
      <button
        v-if="variant === 'dark'"
        type="button"
        class="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        aria-label="Lihat Notifikasi"
        :aria-expanded="isOpen"
        @click="toggleDropdown"
      >
        <i class="pi pi-bell text-xs sm:text-sm text-white" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-brand-ink tabular-nums shadow-xs leading-none"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <button
        v-else
        type="button"
        class="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 cursor-pointer"
        aria-label="Lihat Notifikasi"
        :aria-expanded="isOpen"
        @click="toggleDropdown"
      >
        <i class="pi pi-bell text-base sm:text-lg text-brand-ink" />
        <span
          v-if="unreadCount > 0"
          class="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-brand-canvas tabular-nums shadow-xs leading-none"
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
        class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-brand-canvas border border-brand-hair rounded-card shadow-floating z-50 overflow-hidden flex flex-col text-left"
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

        <!-- Desktop Browser Notification Permission Banner -->
        <div
          v-if="desktopPermission === 'default'"
          class="px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-1.5 text-blue-900 text-[11px] min-w-0">
            <i class="pi pi-bell text-xs text-blue-600 shrink-0" />
            <span class="truncate">Aktifkan notifikasi desktop browser</span>
          </div>
          <button
            type="button"
            class="px-2 py-0.5 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors border-0 shrink-0"
            @click="handleRequestDesktop"
          >
            Aktifkan
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
        <div class="max-h-[360px] overflow-y-auto divide-y divide-brand-hairsoft">
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
          <NotificationBellItem
            v-for="item in filteredItems"
            :key="item.id"
            :item="item"
            :get-type-icon="getTypeIcon"
            :get-type-styles="getTypeStyles"
            :format-time="formatTime"
            @select="handleNotificationClick"
          />

          <!-- Cursor Pagination "Muat Lebih Banyak" -->
          <div
            v-if="hasMore && activeTab === 'all'"
            class="p-2 text-center bg-brand-canvas-soft/20"
          >
            <button
              type="button"
              class="w-full py-1.5 text-[11px] font-semibold text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft rounded transition-colors cursor-pointer border-0 flex items-center justify-center gap-1.5"
              :disabled="isLoadingMore"
              @click="notificationStore.loadMore"
            >
              <i v-if="isLoadingMore" class="pi pi-spin pi-spinner text-xs" />
              <span>{{
                isLoadingMore ? 'Memuat notifikasi...' : 'Muat notifikasi sebelumnya'
              }}</span>
            </button>
          </div>
        </div>

        <!-- Footer Links -->
        <div
          class="p-2.5 border-t border-brand-hairsoft bg-brand-canvas-soft/30 flex items-center justify-between text-xs"
        >
          <NuxtLink
            to="/notifications"
            class="text-[11px] font-semibold text-brand-ink hover:underline no-underline flex items-center gap-1"
            @click="closeDropdown"
          >
            <span>Pusat Notifikasi</span>
            <i class="pi pi-arrow-right text-[9px]" />
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="text-[11px] font-medium text-brand-muted hover:text-brand-ink hover:underline no-underline"
            @click="closeDropdown"
          >
            Pesanan Saya
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>
