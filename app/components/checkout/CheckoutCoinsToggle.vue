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
          ? 'border-amber-400 bg-amber-50/70 dark:border-amber-600/70 dark:bg-amber-950/30 ring-1 ring-amber-400/30 shadow-whisper'
          : 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20 hover:border-amber-300'
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
              ? 'bg-amber-500 text-white shadow-amber-500/20 ring-2 ring-amber-400/20 dark:bg-amber-500 dark:text-zinc-950'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80'
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
            class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/80 px-2 py-0.5 text-[10.5px] font-semibold text-amber-900 dark:border-amber-800/80 dark:bg-amber-900/50 dark:text-amber-200"
          >
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Tersedia {{ formattedBalance }}
          </span>
          <span
            v-if="isAvailable"
            class="text-[10px] font-medium text-amber-800/80 dark:text-amber-300/70"
          >
            (1 Koin = Rp 1)
          </span>
        </div>

        <!-- Description / Feedback text -->
        <p
          v-if="isAvailable && modelValue"
          class="m-0 mt-1 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1"
        >
          <i class="pi pi-check-circle text-amber-600 dark:text-amber-400 text-xs shrink-0" />
          <span
            >Hemat {{ formattedSavings }} ({{ formattedMaxUsable }}) berhasil diterapkan ke
            pesanan.</span
          >
        </p>
        <p
          v-else-if="isAvailable"
          class="m-0 mt-1 text-xs text-amber-800/90 dark:text-amber-300/80"
        >
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
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        modelValue && isAvailable
          ? 'bg-amber-500 dark:bg-amber-500'
          : 'bg-zinc-300 dark:bg-zinc-700',
      ]"
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
