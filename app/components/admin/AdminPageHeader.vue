<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
  }>(),
  {
    subtitle: '',
  },
)
</script>

<template>
  <header
    class="flex flex-col justify-between gap-3 border-b border-brand-hair pb-3.5 sm:flex-row sm:items-end"
  >
    <div class="min-w-0 space-y-1">
      <h1
        class="font-display m-0 flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-brand-ink sm:text-2xl"
      >
        <span>{{ title }}</span>
        <slot name="title-badge" />
      </h1>

      <p v-if="subtitle" class="font-body m-0 max-w-2xl text-xs leading-relaxed text-brand-muted">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
