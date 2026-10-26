<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Lebar dalam token Tailwind, misal `w-32` atau `w-full`. */
    width?: string
    height?: string
    /** Bentuk, `pill` untuk badge dan tombol, `block` untuk baris tabel. */
    shape?: 'block' | 'pill'
  }>(),
  { width: 'w-full', height: 'h-4', shape: 'block' },
)
</script>

<template>
  <div
    aria-hidden="true"
    class="ui-skeleton bg-brand-hairsoft"
    :class="[width, height, shape === 'pill' ? 'rounded-full' : 'rounded-field']"
  />
</template>

<style scoped>
.ui-skeleton {
  position: relative;
  overflow: hidden;
}
.ui-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg, transparent, var(--brand-canvas), transparent);
  animation: ui-skeleton-sweep 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
@keyframes ui-skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ui-skeleton::after {
    animation: none;
    opacity: 0.35;
    transform: none;
  }
}
</style>
