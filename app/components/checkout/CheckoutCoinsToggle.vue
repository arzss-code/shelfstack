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
    class="flex items-center justify-between gap-4 rounded-xl border p-4 transition-all"
    :class="[
      isAvailable
        ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
        : 'border-neutral-200 bg-neutral-50/50 opacity-70 dark:border-neutral-800 dark:bg-neutral-900/40',
    ]"
  >
    <!-- Left info -->
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base shadow-sm"
        :class="[
          isAvailable
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
            : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
        ]"
      >
        <i class="pi pi-dollar" />
      </div>

      <div>
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Tukarkan Koin</h4>
          <span
            v-if="isAvailable"
            class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
          >
            Tersedia {{ formattedBalance }}
          </span>
        </div>

        <p v-if="isAvailable" class="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
          Pakai {{ formattedMaxUsable }} untuk hemat {{ formattedSavings }} (Maks. 50% subtotal).
        </p>
        <p v-else class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {{
            balanceCoins <= 0
              ? 'Saldo koin 0. Belanja untuk kumpulkan cashback koin 1%.'
              : 'Subtotal belum memenuhi syarat pemakaian koin.'
          }}
        </p>
      </div>
    </div>

    <!-- Toggle button -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled || !isAvailable"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="[modelValue && isAvailable ? 'bg-amber-600' : 'bg-neutral-300 dark:bg-neutral-700']"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :class="[modelValue && isAvailable ? 'translate-x-5' : 'translate-x-0']"
      />
    </button>
  </div>
</template>
