<script setup lang="ts">
export interface AdminNavLink {
  to: string
  label: string
  icon: string
  exact: boolean
}

defineProps<{
  links: AdminNavLink[]
  unreadSupportCount: number
  navLabel: string
}>()

const emit = defineEmits<{
  navigate: []
}>()
</script>

<template>
  <nav class="flex flex-col gap-1.5" :aria-label="navLabel">
    <NuxtLink
      v-for="item in links"
      :key="item.to"
      :to="item.to"
      class="rounded-full px-4 py-2.5 text-xs font-semibold no-underline transition-all flex items-center justify-between text-brand-muted hover:text-brand-ink hover:bg-brand-canvas"
      :exact-active-class="item.exact ? '!bg-brand-ink !text-brand-onink shadow-whisper' : ''"
      :active-class="!item.exact ? '!bg-brand-ink !text-brand-onink shadow-whisper' : ''"
      @click="emit('navigate')"
    >
      <div class="flex items-center gap-2.5">
        <i :class="['pi text-xs', item.icon]" />
        <span>{{ item.label }}</span>
      </div>
      <span
        v-if="item.to === '/admin/support' && unreadSupportCount > 0"
        class="unread-support-badge rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none shadow-sm"
      >
        {{ unreadSupportCount > 99 ? '99+' : unreadSupportCount }}
      </span>
    </NuxtLink>
  </nav>
</template>
