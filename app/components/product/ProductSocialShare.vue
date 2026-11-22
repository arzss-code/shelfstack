<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import UiButton from '~/components/ui/UiButton.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'

const props = defineProps<{
  product: Product
}>()

const toast = useUiToast()
const copied = ref(false)

const currentUrl = computed(() => {
  if (
    import.meta.client &&
    window.location?.origin &&
    !window.location.origin.includes('localhost') &&
    window.location.href
  ) {
    return window.location.href
  }
  let siteUrl = 'https://shelfstack.atsiilaarya.me'
  try {
    const config = useRuntimeConfig()
    if (config?.public?.siteUrl) siteUrl = String(config.public.siteUrl)
  } catch {
    // Fallback for isolated unit tests
  }
  siteUrl = siteUrl.replace(/\/+$/, '')
  const identifier = props.product.slug || props.product.id
  return `${siteUrl}/product/${identifier}`
})

const shareMessage = computed(() => {
  return `Lihat ${props.product.name} di ShelfStack (${formatRupiah(props.product.price)}): ${currentUrl.value}`
})

const canNativeShare = computed(() => {
  const isClient = typeof window !== 'undefined' || import.meta.client
  const nav =
    typeof navigator !== 'undefined'
      ? navigator
      : (globalThis as unknown as { navigator?: Navigator }).navigator
  return Boolean(isClient && nav && typeof nav.share === 'function')
})

const handleShareWhatsApp = () => {
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage.value)}`
  if (import.meta.client) {
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }
}

const handleCopyLink = async () => {
  if (import.meta.client && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(currentUrl.value)
      copied.value = true
      toast.add({
        severity: 'success',
        summary: 'Tautan Disalin',
        detail: 'Tautan produk berhasil disalin ke papan klip.',
        life: 2500,
      })
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Gagal Menyalin',
        detail: 'Silakan salin tautan secara manual dari bilah alamat peramban.',
        life: 3000,
      })
    }
  }
}

const handleNativeShare = async () => {
  if (canNativeShare.value) {
    try {
      await navigator.share({
        title: props.product.name,
        text: `Beli ${props.product.name} di ShelfStack`,
        url: currentUrl.value,
      })
    } catch {
      // Pembatalan dialog bawaan peramban tidak memerlukan penanganan error
    }
  }
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas-soft px-4 py-3 text-xs"
  >
    <div class="flex items-center gap-2 text-brand-muted">
      <i class="pi pi-share-alt text-brand-ink" />
      <span class="font-medium text-brand-ink">Bagikan Produk:</span>
    </div>

    <div class="flex items-center gap-2">
      <!-- WhatsApp Direct Share Button -->
      <UiTooltip text="Bagikan ke WhatsApp" position="top">
        <button
          type="button"
          aria-label="Bagikan produk ke WhatsApp"
          class="inline-flex h-8 items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
          @click="handleShareWhatsApp"
        >
          <i class="pi pi-whatsapp text-xs" />
          <span>WhatsApp</span>
        </button>
      </UiTooltip>

      <!-- Copy URL to Clipboard Button -->
      <UiTooltip text="Salin tautan produk" position="top">
        <button
          type="button"
          aria-label="Salin tautan produk"
          class="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas px-3 font-semibold text-brand-ink transition-colors hover:bg-brand-canvas-soft cursor-pointer shadow-whisper"
          @click="handleCopyLink"
        >
          <i :class="['text-xs', copied ? 'pi pi-check text-brand-success' : 'pi pi-link']" />
          <span>{{ copied ? 'Tersalin' : 'Salin Tautan' }}</span>
        </button>
      </UiTooltip>

      <!-- Native Web Share API Button (Mobile/Supported Browser) -->
      <UiButton
        v-if="canNativeShare"
        variant="ghost"
        size="sm"
        aria-label="Buka dialog bagikan peramban"
        icon="pi-external-link"
        @click="handleNativeShare"
      />
    </div>
  </div>
</template>
