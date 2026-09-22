<script setup lang="ts">
/**
 * AuthSubmitButton — Primary CTA button for auth forms.
 * Handles loading spinner, disabled state, and icon in one place.
 */
withDefaults(
  defineProps<{
    loading?: boolean
    label: string
    loadingLabel?: string
    icon?: string
  }>(),
  {
    loading: false,
    loadingLabel: 'Memproses...',
    icon: 'pi-arrow-right',
  },
)
</script>

<template>
  <button
    type="submit"
    :disabled="loading"
    class="mt-2 w-full h-11 rounded-full bg-brand-ink text-white text-sm font-bold tracking-wide hover:bg-black active:scale-[0.98] transition-all shadow-whisper flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
  >
    <i v-if="loading" class="pi pi-spin pi-spinner text-xs" />
    <i v-else :class="`pi ${icon} text-xs`" />
    <span>{{ loading ? loadingLabel : label }}</span>
  </button>
</template>
