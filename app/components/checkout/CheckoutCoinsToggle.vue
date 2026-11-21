<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah } from '~/utils/format'

interface Props {
  modelValue: boolean
  balanceCoins: number
  maxUsableCoins: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isAvailable = computed(() => props.balanceCoins > 0 && props.maxUsableCoins > 0)

const formattedMaxUsable = computed(() => {
  return `${new Intl.NumberFormat('id-ID').format(props.maxUsableCoins)} Koin`
})

const formattedSavings = computed(() => {
  return formatRupiah(props.maxUsableCoins)
})

const formattedBalance = computed(() => {
  return `${new Intl.NumberFormat('id-ID').format(props.balanceCoins)} Koin`
})

const toggle = () => {
  if (props.disabled || !isAvailable.value) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div
    data-testid="checkout-coins-toggle"
    class="flex items-center justify-between gap-4 rounded-card border p-4 sm:p-4.5 transition-all duration-200"
    :class="[
      isAvailable
        ? modelValue
          ? 'border-brand-warning-edge bg-brand-warning-tint ring-1 ring-brand-warning/30 shadow-whisper'
          : 'border-brand-hair bg-brand-canvas-soft hover:border-brand-warning-edge'
        : 'border-brand-hair bg-brand-canvas-soft/40 opacity-70',
    ]"
  >
    <!-- Left info -->
    <div class="flex items-start gap-3 min-w-0">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base shadow-xs transition-colors duration-200"
        :class="[
          isAvailable
            ? modelValue
              ? 'bg-brand-warning text-brand-onink shadow-sm'
              : 'bg-brand-warning-tint text-brand-warning-text border border-brand-warning-edge'
            : 'bg-brand-canvas-soft text-brand-muted border border-brand-hair',
        ]"
      >
        <i class="pi pi-dollar font-bold" />
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="m-0 font-display text-sm font-bold text-brand-ink">
            Tukarkan ShelfStack Koin
          </h3>
          <span
            v-if="isAvailable"
            class="inline-flex items-center gap-1 rounded-full border border-brand-warning-edge bg-brand-warning-tint px-2 py-0.5 text-caption font-semibold text-brand-warning-text"
          >
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-brand-warning" />
            Tersedia {{ formattedBalance }}
          </span>
          <span v-if="isAvailable" class="text-caption font-medium text-brand-muted">
            (1 Koin = Rp 1)
          </span>
        </div>

        <!-- Description / Feedback text -->
        <p
          v-if="isAvailable && modelValue"
          class="m-0 mt-1 text-xs font-medium text-brand-warning-text flex items-center gap-1"
        >
          <i class="pi pi-check-circle text-brand-warning text-xs shrink-0" />
          <span
            >Hemat {{ formattedSavings }} ({{ formattedMaxUsable }}) berhasil diterapkan ke
            pesanan.</span
          >
        </p>
        <p v-else-if="isAvailable" class="m-0 mt-1 text-xs text-brand-muted">
          Pakai {{ formattedMaxUsable }} untuk hemat {{ formattedSavings }} (Maks. 50% subtotal).
        </p>
        <p v-else class="m-0 mt-1 text-xs text-brand-muted">
          {{
            balanceCoins <= 0
              ? 'Saldo koin 0. Belanja untuk kumpulkan cashback koin 1%.'
              : 'Subtotal belum memenuhi syarat pemakaian koin.'
          }}
        </p>
      </div>
    </div>

    <!-- Toggle switch button -->
    <button
      type="button"
      role="switch"
      data-testid="coins-toggle-switch"
      :aria-checked="modelValue && isAvailable"
      :aria-label="'Tukarkan ShelfStack Koin'"
      :disabled="disabled || !isAvailable"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-warning focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="[modelValue && isAvailable ? 'bg-brand-warning' : 'bg-brand-hair']"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
        :class="[modelValue && isAvailable ? 'translate-x-5' : 'translate-x-0']"
      />
    </button>
  </div>
</template>
