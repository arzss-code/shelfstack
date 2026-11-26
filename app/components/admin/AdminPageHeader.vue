<script setup lang="ts">
export interface AdminBreadcrumbItem {
  label: string
  to?: string
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    breadcrumbs?: AdminBreadcrumbItem[]
  }>(),
  {
    subtitle: '',
    breadcrumbs: () => [],
  },
)
</script>

<template>
  <header
    class="flex flex-col justify-between gap-3 border-b border-brand-hair pb-4 sm:flex-row sm:items-end"
  >
    <div class="min-w-0 space-y-1">
      <nav
        v-if="breadcrumbs.length > 0"
        aria-label="Breadcrumb"
        class="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-brand-muted"
      >
        <template v-for="(item, idx) in breadcrumbs" :key="`${item.label}-${idx}`">
          <NuxtLink
            v-if="item.to"
            :to="item.to"
            class="text-brand-muted no-underline transition-colors hover:text-brand-ink"
          >
            {{ item.label }}
          </NuxtLink>
          <span v-else class="font-semibold text-brand-ink">{{ item.label }}</span>
          <span v-if="idx < breadcrumbs.length - 1" class="text-brand-faint" aria-hidden="true">
            /
          </span>
        </template>
      </nav>

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
