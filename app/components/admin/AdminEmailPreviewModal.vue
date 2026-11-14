<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  generateEmailSubject,
  generateEmailHtml,
  type TransactionalEmailType,
} from '~~/shared/utils/email-templates'
import type { Order } from '~/types/order'
import { buildEmailOrderData } from '~/features/orders/utils/order-email'
import UiButton from '~/components/ui/UiButton.vue'
import { useUiToast } from '~/composables/useUiToast'

const props = defineProps<{
  show: boolean
  order?: Order | null
}>()

const emit = defineEmits<{
  close: []
}>()

const toast = useUiToast()
const selectedType = ref<TransactionalEmailType>('order_placed')
const viewMode = ref<'rendered' | 'code'>('rendered')
const viewport = ref<'desktop' | 'mobile'>('desktop')
const copied = ref(false)

const emailTypes: Array<{ id: TransactionalEmailType; label: string; icon: string }> = [
  { id: 'order_placed', label: '1. Pemesanan Baru', icon: 'pi-shopping-cart' },
  { id: 'payment_success', label: '2. Pembayaran Lunas', icon: 'pi-check-circle' },
  { id: 'order_shipped', label: '3. Pesanan Dikirim', icon: 'pi-truck' },
]

const emailOrder = computed(() => buildEmailOrderData(props.order))
const subjectLine = computed(() => generateEmailSubject(selectedType.value, emailOrder.value))
const emailHtml = computed(() => generateEmailHtml(selectedType.value, emailOrder.value))

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

const lockBodyScroll = (locked: boolean) => {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('modal-open', locked)
}

watch(
  () => props.show,
  (open) => {
    if (!import.meta.client) return
    lockBodyScroll(open)
    if (open) {
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  lockBodyScroll(false)
  window.removeEventListener('keydown', handleKeydown)
})

const handleCopyHtml = async () => {
  if (import.meta.client && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(emailHtml.value)
      copied.value = true
      toast.add({
        severity: 'success',
        summary: 'HTML Disalin',
        detail: 'Template HTML email berhasil disalin ke papan klip.',
        life: 2500,
      })
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Gagal Menyalin',
        detail: 'Silakan salin kode secara manual.',
        life: 3000,
      })
    }
  }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="show"
          class="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain"
          @click.self="emit('close')"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-preview-title"
            class="flex flex-col w-full max-w-4xl max-h-[90vh] bg-brand-canvas rounded-card border border-brand-hair shadow-floating overflow-hidden my-auto"
          >
            <!-- Modal Header -->
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-brand-hair bg-brand-canvas-soft"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-full bg-brand-accent-tint flex items-center justify-center text-brand-accent"
                >
                  <i class="pi pi-envelope text-sm" />
                </div>
                <div>
                  <h2
                    id="email-preview-title"
                    class="font-display text-base font-bold text-brand-ink m-0"
                  >
                    Pratinjau Email Transaksional
                  </h2>
                  <p class="text-xs text-brand-muted m-0">
                    Simulasi notifikasi otomatis pelanggan untuk pesanan #{{
                      emailOrder.id.slice(0, 8).toUpperCase()
                    }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                class="w-8 h-8 rounded-full bg-transparent text-brand-muted hover:text-brand-ink hover:bg-brand-field flex items-center justify-center cursor-pointer border-0"
                @click="emit('close')"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </div>

            <!-- Controls: Email Type Tabs & View Switcher -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-brand-hairsoft bg-brand-canvas"
            >
              <!-- Lifecycle Tabs -->
              <div class="inline-flex rounded-lg border border-brand-hairsoft bg-brand-field p-1">
                <button
                  v-for="t in emailTypes"
                  :key="t.id"
                  type="button"
                  :class="[
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 flex items-center gap-1.5',
                    selectedType === t.id
                      ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                      : 'bg-transparent text-brand-muted hover:text-brand-ink',
                  ]"
                  @click="selectedType = t.id"
                >
                  <i :class="['pi text-[11px]', t.icon]" />
                  <span>{{ t.label }}</span>
                </button>
              </div>

              <!-- Render Mode & Viewport Controls -->
              <div class="flex items-center gap-2">
                <div
                  v-if="viewMode === 'rendered'"
                  class="inline-flex rounded-lg border border-brand-hairsoft bg-brand-field p-0.5"
                >
                  <button
                    type="button"
                    :class="[
                      'px-2 py-1 rounded text-xs border-0 cursor-pointer',
                      viewport === 'desktop'
                        ? 'bg-brand-canvas text-brand-ink font-semibold shadow-whisper'
                        : 'bg-transparent text-brand-muted',
                    ]"
                    @click="viewport = 'desktop'"
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    :class="[
                      'px-2 py-1 rounded text-xs border-0 cursor-pointer',
                      viewport === 'mobile'
                        ? 'bg-brand-canvas text-brand-ink font-semibold shadow-whisper'
                        : 'bg-transparent text-brand-muted',
                    ]"
                    @click="viewport = 'mobile'"
                  >
                    Mobile
                  </button>
                </div>

                <UiButton
                  variant="ghost"
                  size="sm"
                  :icon="viewMode === 'rendered' ? 'pi-code' : 'pi-eye'"
                  @click="viewMode = viewMode === 'rendered' ? 'code' : 'rendered'"
                >
                  {{ viewMode === 'rendered' ? 'Lihat HTML' : 'Lihat Visual' }}
                </UiButton>
              </div>
            </div>

            <!-- Envelope Metadata Header -->
            <div
              class="px-6 py-2.5 bg-brand-field/50 border-b border-brand-hairsoft text-xs space-y-1"
            >
              <div class="flex items-center gap-2 text-brand-muted">
                <span class="w-16 font-semibold">Subjek:</span>
                <span class="font-medium text-brand-ink">{{ subjectLine }}</span>
              </div>
              <div class="flex items-center gap-2 text-brand-muted">
                <span class="w-16 font-semibold">Pengirim:</span>
                <span class="text-brand-ink"
                  >ShelfStack Official &lt;noreply@shelfstack.co.id&gt;</span
                >
              </div>
              <div class="flex items-center gap-2 text-brand-muted">
                <span class="w-16 font-semibold">Penerima:</span>
                <span class="text-brand-ink"
                  >{{ emailOrder.customer_name }} &lt;{{ emailOrder.customer_email }}&gt;</span
                >
              </div>
            </div>

            <!-- Email Content Viewport -->
            <div
              class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 flex justify-center"
            >
              <!-- Rendered Visual Iframe -->
              <div
                v-if="viewMode === 'rendered'"
                :class="[
                  'transition-all duration-200 bg-white shadow-card rounded-lg overflow-hidden border border-slate-200',
                  viewport === 'desktop' ? 'w-full max-w-[620px]' : 'w-[375px] max-w-full',
                ]"
              >
                <iframe
                  :srcdoc="emailHtml"
                  class="w-full h-[540px] border-0"
                  title="Pratinjau Email Transaksional"
                />
              </div>

              <!-- Raw HTML Code View -->
              <div v-else class="w-full max-w-3xl">
                <pre
                  class="m-0 p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-auto max-h-[540px] select-all border border-slate-800"
                  >{{ emailHtml }}</pre>
              </div>
            </div>

            <!-- Modal Footer Actions -->
            <div
              class="flex items-center justify-between px-6 py-3 border-t border-brand-hair bg-brand-canvas"
            >
              <UiButton
                variant="secondary"
                size="sm"
                :icon="copied ? 'pi-check' : 'pi-copy'"
                @click="handleCopyHtml"
              >
                {{ copied ? 'Tersalin' : 'Salin Kode HTML' }}
              </UiButton>
              <UiButton variant="primary" size="sm" @click="emit('close')">
                Tutup Pratinjau
              </UiButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
