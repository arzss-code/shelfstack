<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <header
    class="relative overflow-hidden rounded-card bg-brand-obsidian text-white p-6 sm:p-8 shadow-floating"
  >
    <!-- Background Ambient Mesh Gradients -->
    <div
      class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl animate-pulse-slow"
    />
    <div
      class="pointer-events-none absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-slower"
    />

    <!-- Subtle Dot Matrix Background Texture -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
    />

    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-2 max-w-xl">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Voucher &amp; Promo Belanja
        </h1>
        <p class="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          Klaim voucher diskon dan nikmati potongan harga langsung saat checkout pesanan di
          ShelfStack.
        </p>
      </div>

      <!-- Search Bar -->
      <div class="w-full sm:w-72 lg:w-80 shrink-0">
        <div class="bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/15">
          <UiInput
            :model-value="modelValue"
            size="sm"
            placeholder="Cari voucher promo..."
            left-icon="pi-search"
            @update:model-value="$emit('update:modelValue', $event)"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.15) translate(-10px, 10px);
    opacity: 0.4;
  }
}

@keyframes pulse-slower {
  0%,
  100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.1) translate(15px, -15px);
    opacity: 0.35;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-pulse-slower {
  animation: pulse-slower 12s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse-slow,
  .animate-pulse-slower {
    animation: none;
  }
}
</style>
