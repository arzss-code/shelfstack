<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Menambahkan padding default (p-5 sm:p-6) jika true */
    padded?: boolean
    /** Tampilkan interaksi hover (sedikit mengangkat shadow) */
    hoverable?: boolean
  }>(),
  {
    padded: true,
    hoverable: false,
  },
)
</script>

<template>
  <div
    :class="[
      'bg-brand-canvas border border-brand-hair rounded-card shadow-whisper overflow-hidden transition-shadow duration-300',
      padded ? 'p-5 sm:p-6' : '',
      hoverable ? 'hover:shadow-floating cursor-pointer' : '',
    ]"
  >
    <slot />
  </div>
</template>
