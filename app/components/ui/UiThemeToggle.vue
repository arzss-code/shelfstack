<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeMode } from '~/composables/useThemeMode'

const { isDark, toggleTheme, initTheme } = useThemeMode()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <button
    type="button"
    data-testid="theme-toggle-button"
    class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft border border-transparent hover:border-brand-hair transition-colors active:scale-95 cursor-pointer shrink-0"
    :aria-label="isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'"
    :aria-pressed="isDark"
    :title="isDark ? 'Mode Terang' : 'Mode Gelap'"
    @click="toggleTheme"
  >
    <i :class="['pi text-base', isDark ? 'pi-sun text-brand-warning' : 'pi-moon text-brand-ink']" />
  </button>
</template>
