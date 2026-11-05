<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { NotificationItem } from '../../shared/schemas/notification'
import { useNotificationStore } from '~/features/notifications/stores/notifications'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import NotificationHeader from '~/components/notification/NotificationHeader.vue'
import NotificationCard from '~/components/notification/NotificationCard.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Pusat Notifikasi - ShelfStack',
  description:
    'Kelola seluruh riwayat notifikasi pesanan, pembayaran, dan informasi akun Anda di ShelfStack.',
})

const notificationStore = useNotificationStore()
const { items, unreadCount, isLoading, isLoadingMore, hasMore, desktopPermission } =
  storeToRefs(notificationStore)

const activeTab = ref<'all' | 'unread' | 'orders' | 'system'>('all')

onMounted(async () => {
  notificationStore.initDesktopPermission()
  if (items.value.length === 0) {
    await notificationStore.fetchNotifications(true)
  }
})

const filteredItems = computed<NotificationItem[]>(() => {
  if (activeTab.value === 'unread') {
    return items.value.filter((item: NotificationItem) => !item.is_read)
  }
  if (activeTab.value === 'orders') {
    return items.value.filter(
      (item: NotificationItem) =>
        item.type === 'order_created' ||
        item.type === 'payment_success' ||
        item.type === 'order_shipped' ||
        item.type === 'order_completed' ||
        item.type === 'order_cancelled',
    )
  }
  if (activeTab.value === 'system') {
    return items.value.filter((item: NotificationItem) => item.type === 'system')
  }
  return items.value
})

const handleToggleDesktopPermission = async () => {
  if (desktopPermission.value !== 'granted') {
    await notificationStore.requestDesktopPermission()
  }
}

const handleNavigate = async (item: NotificationItem) => {
  if (!item.is_read) {
    await notificationStore.markAsRead(item.id)
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Notifikasi</span>
    </nav>

    <!-- 2-Column Master Layout -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Page Header & Filter Tabs (Modular Component) -->
        <NotificationHeader
          v-model:active-tab="activeTab"
          :unread-count="unreadCount"
          :total-count="items.length"
          :desktop-permission="desktopPermission"
          @mark-all-as-read="notificationStore.markAllAsRead"
          @toggle-desktop-permission="handleToggleDesktopPermission"
        />

        <!-- Notification List -->
        <div class="bg-white border border-brand-hair rounded-card overflow-hidden shadow-whisper">
          <!-- Loading -->
          <div v-if="isLoading" class="p-12 text-center text-xs text-brand-muted">
            <i class="pi pi-spin pi-spinner text-2xl text-brand-muted mb-2 block" />
            Memuat daftar notifikasi...
          </div>

          <!-- Empty State -->
          <div
            v-else-if="filteredItems.length === 0"
            class="px-6 py-16 text-center flex flex-col items-center justify-center gap-3"
          >
            <div
              class="w-14 h-14 rounded-full bg-brand-canvas-soft flex items-center justify-center text-brand-muted"
            >
              <i class="pi pi-bell-slash text-2xl" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-brand-ink m-0">
                {{
                  activeTab === 'unread'
                    ? 'Semua notifikasi telah dibaca'
                    : 'Tidak ada notifikasi untuk kategori ini'
                }}
              </h3>
              <p class="text-xs text-brand-muted mt-1 max-w-sm m-0">
                {{
                  activeTab === 'unread'
                    ? 'Beralih ke tab Semua untuk melihat riwayat pesan sebelumnya.'
                    : 'Pembaruan otomatis pesanan, pembayaran Midtrans, dan pengiriman ekspedisi akan muncul di sini.'
                }}
              </p>
            </div>
            <NuxtLink
              to="/katalog"
              class="mt-2 px-4 py-2 rounded-full bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors no-underline inline-flex items-center gap-1.5"
            >
              <span>Mulai Belanja</span>
              <i class="pi pi-arrow-right text-[10px]" />
            </NuxtLink>
          </div>

          <!-- Items (Modular NotificationCard) -->
          <div v-else class="divide-y divide-brand-hairsoft">
            <NotificationCard
              v-for="item in filteredItems"
              :key="item.id"
              :item="item"
              @read="notificationStore.markAsRead"
              @navigate="handleNavigate"
            />
          </div>

          <!-- Cursor Pagination Load More -->
          <div
            v-if="hasMore && activeTab === 'all'"
            class="p-4 text-center border-t border-brand-hairsoft bg-brand-canvas-soft/30"
          >
            <button
              type="button"
              class="px-5 py-2 text-xs font-semibold text-brand-ink bg-white border border-brand-hair hover:bg-brand-canvas-soft rounded-full transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
              :disabled="isLoadingMore"
              @click="notificationStore.loadMore"
            >
              <i v-if="isLoadingMore" class="pi pi-spin pi-spinner text-xs" />
              <span>{{ isLoadingMore ? 'Memuat notifikasi...' : 'Muat Lebih Banyak' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
