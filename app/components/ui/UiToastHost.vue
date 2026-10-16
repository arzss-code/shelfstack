<script setup lang="ts">
import { computed } from 'vue'
import type { UiToastSeverity } from '~/composables/useUiToast'

const { toasts, remove } = useUiToast()

const toneMap: Record<UiToastSeverity, { icon: string; chip: string }> = {
  success: { icon: 'pi pi-check-circle', chip: 'text-brand-success bg-brand-success-tint' },
  error: { icon: 'pi pi-times-circle', chip: 'text-brand-danger bg-brand-danger-tint' },
  warn: { icon: 'pi pi-exclamation-triangle', chip: 'text-brand-warning bg-brand-warning-tint' },
  info: { icon: 'pi pi-info-circle', chip: 'text-brand-accent bg-brand-accent-tint' },
  secondary: { icon: 'pi pi-bell', chip: 'text-brand-muted bg-brand-field' },
}

const toneOf = (severity: UiToastSeverity) => toneMap[severity] ?? toneMap.secondary
const summaryId = (id: number) => `ui-toast-summary-${id}`
const visibleToasts = computed(() => toasts.value.slice(-4))
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        class="pointer-events-none fixed inset-x-4 bottom-4 z-[1100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
        role="region"
        aria-label="Notifikasi aplikasi"
      >
        <TransitionGroup name="ui-toast">
          <article
            v-for="toast in visibleToasts"
            :key="toast.id"
            class="pointer-events-auto flex w-full items-start gap-3 rounded-card border border-brand-hair bg-brand-canvas px-4 py-3 shadow-floating"
          >
            <span
              class="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              :class="toneOf(toast.severity).chip"
            >
              <i :class="toneOf(toast.severity).icon" aria-hidden="true" />
            </span>

            <div class="min-w-0 flex-1">
              <p
                :id="summaryId(toast.id)"
                class="m-0 text-[13px] font-bold leading-snug tracking-tight text-brand-ink"
              >
                {{ toast.summary }}
              </p>
              <p v-if="toast.detail" class="m-0 mt-0.5 text-xs leading-relaxed text-brand-muted">
                {{ toast.detail }}
              </p>
            </div>

            <button
              type="button"
              class="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-faint transition-colors hover:bg-brand-field hover:text-brand-ink"
              aria-label="Tutup notifikasi"
              @click="remove(toast.id)"
            >
              <i class="pi pi-times text-[10px]" aria-hidden="true" />
            </button>
          </article>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.ui-toast-enter-active,
.ui-toast-leave-active {
  transition:
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}
.ui-toast-enter-from {
  transform: translateX(14px);
  opacity: 0;
}
.ui-toast-leave-to {
  transform: translateY(6px) scale(0.98);
  opacity: 0;
}
.ui-toast-move {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (prefers-reduced-motion: reduce) {
  .ui-toast-enter-active,
  .ui-toast-leave-active,
  .ui-toast-move {
    transition: none;
  }
}
</style>
