<script setup lang="ts">
import { computed } from 'vue'
import type { UserVoucherItem } from '~~/shared/schemas/user-voucher'
import UiButton from '~/components/ui/UiButton.vue'
import { useUiToast } from '~/composables/useUiToast'

const props = withDefaults(
  defineProps<{
    voucher: UserVoucherItem
    mode: 'claimed' | 'discoverable' | 'history'
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  claim: [couponId: string]
}>()

const toast = useUiToast()

const expiryText = computed(() => {
  if (!props.voucher.expires_at) return 'Tanpa batas waktu'
  try {
    const d = new Date(props.voucher.expires_at)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return props.voucher.expires_at
  }
})

const isPercentage = computed(() => props.voucher.discount_type === 'percentage')

const handleCopyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.voucher.code)
    toast.show({
      title: 'Kode Disalin',
      message: `Kode ${props.voucher.code} siap digunakan saat checkout.`,
      tone: 'info',
    })
  } catch {
    // Ignore clipboard error
  }
}

const handleClaim = () => {
  emit('claim', props.voucher.coupon_id)
}
</script>

<template>
  <div
    class="relative flex flex-col sm:flex-row bg-brand-canvas border border-brand-hair rounded-card overflow-hidden shadow-whisper transition-all duration-150 hover:shadow-floating"
    :class="{ 'opacity-65 grayscale-25': mode === 'history' }"
  >
    <!-- Left Ticket Cutout Notch (Decorative for desktop) -->
    <div
      class="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-canvas border border-brand-hair z-10"
    />

    <!-- Left Badge Pillar: Discount Display -->
    <div
      class="w-full sm:w-36 shrink-0 p-4 sm:p-5 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center bg-brand-canvas-soft border-b sm:border-b-0 sm:border-r border-brand-hairsoft relative"
    >
      <div class="flex items-center sm:flex-col gap-2">
        <div
          class="w-10 h-10 rounded-field flex items-center justify-center text-brand-ink bg-brand-canvas border border-brand-hair shadow-whisper shrink-0"
        >
          <i :class="isPercentage ? 'pi pi-percentage text-base' : 'pi pi-tag text-base'" />
        </div>
        <div>
          <span class="block text-sm sm:text-base font-display font-bold text-brand-ink">
            {{ voucher.formatted_discount }}
          </span>
          <span class="text-[10px] text-brand-muted block mt-0.5">
            {{
              isPercentage && voucher.max_discount_cents
                ? `Maks. ${voucher.formatted_max_discount}`
                : 'Diskon Langsung'
            }}
          </span>
        </div>
      </div>

      <!-- Mobile code tag -->
      <span
        class="sm:hidden font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-brand-canvas border border-brand-hair text-brand-ink"
      >
        {{ voucher.code }}
      </span>
    </div>

    <!-- Center/Right Details Section -->
    <div class="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div>
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <h3 class="text-sm font-bold text-brand-ink m-0">
            {{ voucher.name }}
          </h3>
          <button
            type="button"
            class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-canvas-soft border border-brand-hair text-brand-ink hover:bg-brand-canvas text-[11px] font-mono font-bold transition-colors cursor-pointer"
            title="Klik untuk menyalin kode voucher"
            @click="handleCopyCode"
          >
            <span>{{ voucher.code }}</span>
            <i class="pi pi-copy text-[10px] text-brand-muted" />
          </button>
        </div>

        <p class="text-xs text-brand-muted m-0 mt-1 line-clamp-2">
          {{
            voucher.description ||
            'Gunakan voucher ini saat pembayaran pesanan belanja resmi ShelfStack.'
          }}
        </p>

        <div class="flex items-center gap-3 mt-3 text-[11px] text-brand-muted flex-wrap">
          <span class="flex items-center gap-1">
            <i class="pi pi-shopping-bag text-[10px]" />
            <span>Min. Belanja {{ voucher.formatted_min_purchase }}</span>
          </span>
          <span class="text-brand-hair">|</span>
          <span class="flex items-center gap-1">
            <i class="pi pi-calendar text-[10px]" />
            <span>Hingga {{ expiryText }}</span>
          </span>
        </div>
      </div>

      <!-- Action Area -->
      <div class="pt-3 border-t border-brand-hairsoft flex items-center justify-between gap-2">
        <span
          v-if="voucher.status === 'used'"
          class="text-xs font-semibold text-brand-muted flex items-center gap-1"
        >
          <i class="pi pi-check-circle text-emerald-600 text-xs" />
          <span>Telah Digunakan</span>
        </span>
        <span
          v-else-if="voucher.is_expired"
          class="text-xs font-semibold text-rose-600 flex items-center gap-1"
        >
          <i class="pi pi-clock text-xs" />
          <span>Kedaluwarsa</span>
        </span>
        <span v-else class="text-[11px] text-brand-muted font-medium">
          {{ mode === 'claimed' ? 'Tersimpan di Dompet' : 'Tersedia untuk Diklaim' }}
        </span>

        <!-- Contextual Button -->
        <div class="shrink-0">
          <UiButton
            v-if="mode === 'claimed'"
            to="/katalog"
            variant="primary"
            size="sm"
            class="active:scale-95"
          >
            Pakai Sekarang
          </UiButton>
          <UiButton
            v-else-if="mode === 'discoverable'"
            variant="secondary"
            size="sm"
            :loading="loading"
            class="active:scale-95"
            @click="handleClaim"
          >
            Klaim Voucher
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Right Ticket Cutout Notch (Decorative for desktop) -->
    <div
      class="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-canvas border border-brand-hair z-10"
    />
  </div>
</template>
