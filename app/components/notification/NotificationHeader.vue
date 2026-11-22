<script setup lang="ts">
defineProps<{
  unreadCount: number
  totalCount: number
  desktopPermission: string
  activeTab: 'all' | 'unread' | 'orders' | 'system'
}>()

defineEmits<{
  'update:activeTab': [tab: 'all' | 'unread' | 'orders' | 'system']
  markAllAsRead: []
  toggleDesktopPermission: []
}>()
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-5 sm:p-6 mb-6 shadow-whisper">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="font-display text-xl sm:text-2xl font-bold text-brand-ink tracking-tight m-0">
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
          Pembaruan riwayat pesanan, status pembayaran, pengiriman ekspedisi, dan pengumuman akun.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="unreadCount > 0"
          type="button"
          class="px-3 py-1.5 text-xs font-semibold rounded-full bg-brand-canvas-soft hover:bg-brand-hair text-brand-ink transition-colors cursor-pointer border border-brand-hair inline-flex items-center gap-1.5"
          @click="$emit('markAllAsRead')"
        >
          <i class="pi pi-check-circle text-xs" />
          <span>Tandai Semua Dibaca</span>
        </button>

        <!-- Browser Notification Permission Toggle -->
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer border inline-flex items-center gap-1.5"
          :class="
            desktopPermission === 'granted'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-brand-canvas hover:bg-brand-canvas-soft text-brand-muted border-brand-hair'
          "
          :title="
            desktopPermission === 'granted'
              ? 'Notifikasi browser telah aktif'
              : 'Klik untuk mengaktifkan notifikasi browser'
          "
          @click="$emit('toggleDesktopPermission')"
        >
          <i
            class="pi"
            :class="desktopPermission === 'granted' ? 'pi-bell text-emerald-600' : 'pi-bell-slash'"
          />
          <span class="hidden sm:inline">
            {{
              desktopPermission === 'granted'
                ? 'Notifikasi Browser Aktif'
                : 'Aktifkan Notifikasi Browser'
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
            ? 'bg-brand-ink text-brand-onink'
            : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
        "
        @click="$emit('update:activeTab', 'all')"
      >
        Semua ({{ totalCount }})
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap flex items-center gap-1.5"
        :class="
          activeTab === 'unread'
            ? 'bg-brand-ink text-brand-onink'
            : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
        "
        @click="$emit('update:activeTab', 'unread')"
      >
        <span>Belum Dibaca</span>
        <span
          v-if="unreadCount > 0"
          class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
          :class="
            activeTab === 'unread' ? 'bg-brand-canvas text-brand-ink' : 'bg-rose-500 text-white'
          "
        >
          {{ unreadCount }}
        </span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap"
        :class="
          activeTab === 'orders'
            ? 'bg-brand-ink text-brand-onink'
            : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
        "
        @click="$emit('update:activeTab', 'orders')"
      >
        Pesanan &amp; Pembayaran
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer border-0 whitespace-nowrap"
        :class="
          activeTab === 'system'
            ? 'bg-brand-ink text-brand-onink'
            : 'bg-brand-canvas-soft text-brand-muted hover:text-brand-ink'
        "
        @click="$emit('update:activeTab', 'system')"
      >
        Sistem
      </button>
    </div>
  </div>
</template>
