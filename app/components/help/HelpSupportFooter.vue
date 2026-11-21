<script setup lang="ts">
const handleOpenLiveChat = () => {
  try {
    const { toggleChat } = useSupportChat()
    toggleChat()
  } catch {
    // Fallback for test environments without Nuxt context
  }
}
</script>

<template>
  <footer
    class="mt-12 sm:mt-16 bg-brand-canvas border border-brand-hair rounded-card p-6 sm:p-8 text-center shadow-whisper"
  >
    <div
      class="w-12 h-12 rounded-full bg-brand-canvas-soft text-brand-ink flex items-center justify-center mx-auto mb-3"
    >
      <i class="pi pi-question-circle text-xl" aria-hidden="true" />
    </div>
    <h2 class="font-display text-lg sm:text-xl font-bold text-brand-ink m-0 tracking-tight">
      Masih Butuh Bantuan?
    </h2>
    <p class="text-xs sm:text-sm text-brand-muted mt-1.5 max-w-md mx-auto m-0 leading-relaxed">
      Tim customer care kami siap mendampingi kebutuhan transaksi Anda setiap hari kerja pukul 09.00
      - 18.00 WIB.
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
      <UiButton
        variant="primary"
        icon="pi-comments"
        data-testid="btn-live-chat"
        @click="handleOpenLiveChat"
      >
        Buka Live Chat
      </UiButton>
      <UiButton to="/contact" variant="outline" icon="pi pi-envelope" data-testid="btn-contact">
        Hubungi Kami
      </UiButton>
      <UiButton to="/tracking" variant="outline" icon="pi pi-compass" data-testid="btn-tracking">
        Lacak Pesanan
      </UiButton>
    </div>
  </footer>
</template>
