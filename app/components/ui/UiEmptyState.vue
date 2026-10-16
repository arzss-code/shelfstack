<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    title: string
    description?: string
    /** Aksi pemulihan, misal "Tampilkan semua" atau "Coba lagi". */
    actionLabel?: string
  }>(),
  { description: '', actionLabel: '' },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-card border border-dashed border-brand-hair bg-brand-canvas px-8 py-14 text-center"
  >
    <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-canvas-soft">
      <i :class="['pi', icon, 'text-xl text-brand-faint']" aria-hidden="true" />
    </span>

    <h3 class="m-0 font-display text-base font-bold text-brand-ink">{{ title }}</h3>
    <p v-if="description" class="m-0 mt-1.5 max-w-sm text-xs leading-relaxed text-brand-muted">
      {{ description }}
    </p>

    <UiButton v-if="actionLabel" variant="secondary" size="sm" class="mt-5" @click="emit('action')">
      {{ actionLabel }}
    </UiButton>
  </div>
</template>
