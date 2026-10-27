<template>
  <div class="min-h-screen bg-brand-canvas-soft/40 py-6 sm:py-10">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-brand-muted mb-4" aria-label="Breadcrumb">
        <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline"
          >Beranda</NuxtLink
        >
        <span class="text-brand-hair">/</span>
        <span class="text-brand-ink font-semibold">Notifikasi</span>
      </nav>

      <!-- Page Header -->
      <div class="bg-white border border-brand-hair rounded-card p-5 sm:p-6 mb-6 shadow-whisper">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1
                class="font-display text-xl sm:text-2xl font-bold text-brand-ink tracking-tight m-0"
              >
                Pusat Notifikasi
              </h1>
              <span
                v-if="unreadCount > 0"
                class="px-2 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full tabular-nums"
              >
                {{ unreadCount }} belum dibaca
              </span>
            </div>
            <p class="text-xs sm:text-sm text-brand-muted mt-1 m-0">
              Pembaruan riwayat pesanan, status pembayaran, pengiriman ekspedisi, dan pengumuman
              akun.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="unreadCount > 0"
              type="button"
              class="px-3 py-1.5 text-xs font-semibold rounded-full bg-brand-canvas-soft hover:bg-brand-hair text-brand-ink transition-colors cursor-pointer border border-brand-hair inline-flex items-center gap-1.5"
              @click="notificationStore.markAllAsRead"
            >
              <i class="pi pi-check-circle text-xs" />
              <span>Tandai Semua Dibaca</span>
            </button>

            <!-- Desktop Notification Permission Toggle (Point 3) -->
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer border inline-flex items-center gap-1.5"
              :class="
                desktopPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white hover:bg-brand-canvas-soft text-brand-muted border-brand-hair'
              "
              :title="
                desktopPermission === 'granted'
                  ? 'Notifikasi browser desktop telah aktif'
                  : 'Klik untuk mengaktifkan notifikasi browser desktop'
              "
              @click="handleToggleDesktopPermission"
            >
              <i
                class="pi"
                :class="
                  desktopPermission === 'granted' ? 'pi-bell text-emerald-600' : 'pi-bell-slash'
                "
              />
              <span class="hidden sm:inline">
                {{
                  desktopPermission === 'granted'
                    ? 'Notifikasi Desktop Aktif'
                    : 'Aktifkan Notifikasi Desktop'
                }}
              </span>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div
          class="flex items-center gap-2 mt-5 pt-4 border-t border-brand-hairsoft overflow-x-auto [scrollbar-width:none]"
        >
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap"
            :class="
              activeTab === 'all'
                ? 'bg-brand-ink text-white'
                : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'all'"
          >
            Semua ({{ items.length }})
          </button>

          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'unread'
                ? 'bg-brand-ink text-white'
                : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'unread'"
          >
            <span>Belum Dibaca</span>
            <span
              v-if="unreadCount > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              :class="activeTab === 'unread' ? 'bg-white text-brand-ink' : 'bg-rose-500 text-white'"
            >
              {{ unreadCount }}
            </span>
          </button>

          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap"
            :class="
              activeTab === 'orders'
                ? 'bg-brand-ink text-white'
                : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'orders'"
          >
            Pesanan &amp; Pembayaran
          </button>

          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap"
            :class="
              activeTab === 'system'
                ? 'bg-brand-ink text-white'
                : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'system'"
          >
            Sistem
          </button>
        </div>
      </div>

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

        <!-- Items -->
        <div v-else class="divide-y divide-brand-hairsoft">
          <div
            v-for="item in filteredItems"
            :key="item.id"
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
                    :class="
                      item.is_read ? 'text-brand-ink font-semibold' : 'text-brand-ink font-bold'
                    "
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
                  @click="handleNavigate(item)"
                >
                  <span>Buka Halaman Terkait</span>
                  <i class="pi pi-arrow-right text-[10px]" />
                </NuxtLink>

                <button
                  v-if="!item.is_read"
                  type="button"
                  class="text-xs text-brand-muted hover:text-brand-ink font-medium bg-transparent border-0 p-0 cursor-pointer"
                  @click="notificationStore.markAsRead(item.id)"
                >
                  Tandai dibaca
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cursor Pagination Load More (Point 4) -->
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
</template>

<script setup lang="ts">
import type { NotificationItem, NotificationType } from '../../shared/schemas/notification'
import { useNotificationStore } from '~/features/notifications/stores/notifications'

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
