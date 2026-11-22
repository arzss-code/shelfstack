<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Menambahkan padding default (p-5 sm:p-6) jika true */
    padded?: boolean
    /** Tampilkan interaksi hover (sedikit mengangkat shadow) */
    hoverable?: boolean
    /** Terapkan overflow-hidden jika kartu memiliki media flush di tepi */
    overflowHidden?: boolean
  }>(),
  {
    padded: true,
    hoverable: false,
    overflowHidden: false,
  },
)
</script>

<template>
  <div
    :class="[
      'bg-brand-canvas border border-brand-hair rounded-card shadow-whisper transition-shadow duration-300',
      padded ? 'p-5 sm:p-6' : '',
      hoverable ? 'hover:shadow-floating cursor-pointer' : '',
      overflowHidden ? 'overflow-hidden' : '',
    ]"
  >
    <slot />
  </div>
</template>
