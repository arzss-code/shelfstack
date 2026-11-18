<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeMode } from '~/composables/useThemeMode'

const { isDark, setTheme, initTheme } = useThemeMode()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <section
    class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper"
    aria-labelledby="theme-settings-heading"
  >
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <i class="pi pi-palette text-brand-muted text-sm" aria-hidden="true" />
          <h2
            id="theme-settings-heading"
            class="text-base font-display font-bold text-brand-ink m-0"
          >
            Preferensi Tampilan
          </h2>
        </div>
        <p class="text-xs text-brand-muted m-0">
          Pilih tema warna antarmuka yang paling nyaman digunakan di seluruh halaman ShelfStack.
        </p>
      </div>

      <div
        role="group"
        aria-label="Pilih tema antarmuka"
        class="inline-flex items-center bg-brand-field border border-brand-hair rounded-full p-1 gap-1 shrink-0 self-start sm:self-center"
      >
        <button
          type="button"
          data-testid="settings-theme-light"
          class="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-0"
          :class="
            !isDark
              ? 'bg-brand-canvas text-brand-ink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink'
          "
          :aria-pressed="!isDark"
          @click="setTheme('light')"
        >
          <i class="pi pi-sun text-xs" aria-hidden="true" />
          <span>Mode Terang</span>
        </button>

        <button
          type="button"
          data-testid="settings-theme-dark"
          class="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-0"
          :class="
            isDark
              ? 'bg-brand-canvas text-brand-ink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink'
          "
          :aria-pressed="isDark"
          @click="setTheme('dark')"
        >
          <i class="pi pi-moon text-xs" aria-hidden="true" />
          <span>Mode Gelap</span>
        </button>
      </div>
    </div>
  </section>
</template>
