<script setup lang="ts">
import { ref } from 'vue'
import type { CoinExchangeCatalogItem } from '~~/shared/schemas/loyalty-coin'

interface Props {
  catalog: CoinExchangeCatalogItem[]
  userBalance: number
  isExchanging: boolean
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'exchange', couponId: string): void
}>()

const exchangingCouponId = ref<string | null>(null)

const handleExchange = async (couponId: string) => {
  exchangingCouponId.value = couponId
  emit('exchange', couponId)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div class="mt-4 h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div class="mt-2 h-4 w-48 rounded bg-neutral-100 dark:bg-neutral-800/60" />
        <div class="mt-6 flex items-center justify-between">
          <div class="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div class="h-9 w-28 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>

    <!-- Empty catalog state -->
    <div
      v-else-if="catalog.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
      >
        <i class="pi pi-ticket text-2xl" />
      </div>
      <h3 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
        Belum Ada Voucher Penukaran
      </h3>
      <p class="mt-1 max-w-sm text-xs text-neutral-500 dark:text-neutral-400">
        Saat ini belum ada voucher penukaran koin yang tersedia. Nantikan penawaran eksklusif
        berikutnya!
      </p>
    </div>

    <!-- Catalog grid -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="item in catalog"
        :key="item.id"
        class="group relative flex flex-col justify-between rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50/40 to-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-amber-900/40 dark:from-neutral-900 dark:to-neutral-900"
      >
        <div>
          <!-- Header: Discount pill & Coin cost badge -->
          <div class="flex items-start justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
            >
              <i class="pi pi-tag text-xs" />
              {{ item.formatted_discount }}
            </span>

            <span
              class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
            >
              <i class="pi pi-dollar text-xs text-amber-600 dark:text-amber-400" />
              {{ item.formatted_coin_cost }}
            </span>
          </div>

          <!-- Voucher Name & Description -->
          <h4
            class="mt-3 text-base font-bold text-neutral-900 transition-colors group-hover:text-amber-700 dark:text-neutral-100 dark:group-hover:text-amber-400"
          >
            {{ item.name }}
          </h4>
          <p v-if="item.description" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {{ item.description }}
          </p>

          <!-- Min purchase & terms -->
          <div
            class="mt-4 space-y-1 rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400"
          >
            <div class="flex justify-between">
              <span>Min. Belanja:</span>
              <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{
                item.formatted_min_purchase
              }}</span>
            </div>
            <div v-if="item.formatted_max_discount" class="flex justify-between">
              <span>Maks. Potongan:</span>
              <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{
                item.formatted_max_discount
              }}</span>
            </div>
          </div>
        </div>

        <!-- Exchange Action Button -->
        <div class="mt-5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <button
            v-if="item.is_claimed"
            type="button"
            disabled
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            <i class="pi pi-check text-xs" />
            <span>Sudah Ditukarkan</span>
          </button>

          <button
            v-else-if="userBalance < item.coin_cost"
            type="button"
            disabled
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
          >
            <i class="pi pi-lock text-xs" />
            <span>Koin Tidak Cukup</span>
          </button>

          <button
            v-else
            type="button"
            :disabled="isExchanging"
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleExchange(item.id)"
          >
            <i
              v-if="isExchanging && exchangingCouponId === item.id"
              class="pi pi-spin pi-spinner text-xs"
            />
            <i v-else class="pi pi-sync text-xs" />
            <span>{{
              isExchanging && exchangingCouponId === item.id
                ? 'Memproses...'
                : 'Tukar Koin Sekarang'
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
