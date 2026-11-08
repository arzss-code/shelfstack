<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    forceOffline?: boolean
  }>(),
  {
    forceOffline: false,
  },
)

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

const updateOnlineStatus = () => {
  if (typeof navigator !== 'undefined') {
    isOnline.value = navigator.onLine
  }
}

onMounted(() => {
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const showBanner = computed(() => props.forceOffline || !isOnline.value)

const retryConnection = () => {
  updateOnlineStatus()
  if (isOnline.value && typeof window !== 'undefined') {
    window.location.reload()
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="bg-amber-500 text-brand-ink px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md fixed top-0 left-0 right-0 z-50 border-b border-amber-600"
      role="alert"
      data-testid="offline-banner"
    >
      <div class="flex items-center gap-2 min-w-0">
        <i class="pi pi-wifi text-brand-ink shrink-0" aria-hidden="true" />
        <span class="truncate">
          Koneksi internet terputus. Anda sedang melihat konten yang tersimpan di perangkat.
        </span>
      </div>

      <button
        type="button"
        class="shrink-0 rounded-full bg-brand-ink text-white px-3.5 py-1 text-xs font-bold hover:bg-brand-ink/90 transition-colors inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0"
        @click="retryConnection"
      >
        <i class="pi pi-refresh text-[10px]" aria-hidden="true" />
        <span>Hubungkan Ulang</span>
      </button>
    </div>
  </Transition>
</template>
