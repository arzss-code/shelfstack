<script setup lang="ts">
import { computed } from 'vue'
import type { AdminNavLink } from '~/components/admin/AdminSidebarNav.vue'

const props = defineProps<{
  navLinks: AdminNavLink[]
}>()

interface HeaderCrumb {
  label: string
  to?: string
  tabular?: boolean
}

const route = useRoute()

const crumbs = computed<HeaderCrumb[]>(() => {
  const path = route.path
  if (path === '/admin' || path === '/admin/') {
    return [{ label: 'Ringkasan' }]
  }
  const orderDetailPrefix = '/admin/orders/'
  if (path.startsWith(orderDetailPrefix) && path.length > orderDetailPrefix.length) {
    const id = String(route.params.id || path.slice(orderDetailPrefix.length))
    return [
      { label: 'Pesanan', to: '/admin/orders' },
      { label: `#${id.slice(0, 8).toUpperCase()}`, tabular: true },
    ]
  }
  const matched = props.navLinks.find((link) => !link.exact && path.startsWith(link.to))
  return matched ? [{ label: matched.label }] : []
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex min-w-0 items-center gap-1.5 text-xs">
    <NuxtLink
      to="/"
      class="font-display text-sm font-bold text-brand-ink no-underline hover:opacity-80 shrink-0 rounded-sm"
    >
      ShelfStack
    </NuxtLink>
    <span class="text-brand-faint hidden sm:inline" aria-hidden="true">/</span>
    <NuxtLink
      to="/admin"
      class="hidden sm:inline font-medium no-underline transition-colors shrink-0 rounded-sm"
      :class="
        crumbs.length === 0
          ? 'font-semibold text-brand-ink'
          : 'text-brand-muted hover:text-brand-ink'
      "
    >
      Panel Admin
    </NuxtLink>
    <template v-for="(crumb, idx) in crumbs" :key="`${crumb.label}-${idx}`">
      <span
        class="text-brand-faint shrink-0"
        :class="idx === 0 ? 'hidden sm:inline' : ''"
        aria-hidden="true"
        >/</span
      >
      <NuxtLink
        v-if="crumb.to"
        :to="crumb.to"
        class="hidden sm:inline truncate text-brand-muted hover:text-brand-ink no-underline transition-colors rounded-sm"
      >
        {{ crumb.label }}
      </NuxtLink>
      <span
        v-else
        class="truncate font-semibold text-brand-ink"
        :class="[idx === 0 ? 'hidden sm:inline' : '', crumb.tabular ? 'tabular' : '']"
      >
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>
