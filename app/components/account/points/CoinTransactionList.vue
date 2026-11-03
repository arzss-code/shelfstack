<script setup lang="ts">
import type { CoinTransaction, CoinTransactionType } from '~~/shared/schemas/loyalty-coin'

interface Props {
  transactions: CoinTransaction[]
  isLoading: boolean
}

defineProps<Props>()

const getTransactionBadge = (type: CoinTransactionType) => {
  switch (type) {
    case 'earned':
      return {
        icon: 'pi-arrow-down-left',
        bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        amountClass: 'text-emerald-600 dark:text-emerald-400',
      }
    case 'welcome_bonus':
      return {
        icon: 'pi-gift',
        bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        amountClass: 'text-amber-600 dark:text-amber-400',
      }
    case 'refunded_order':
    case 'cancelled_order':
      return {
        icon: 'pi-refresh',
        bgClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
        amountClass: 'text-sky-600 dark:text-sky-400',
      }
    case 'redeemed_voucher':
      return {
        icon: 'pi-ticket',
        bgClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
        amountClass: 'text-rose-600 dark:text-rose-400',
      }
    case 'spent':
    default:
      return {
        icon: 'pi-shopping-bag',
        bgClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
        amountClass: 'text-rose-600 dark:text-rose-400',
      }
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading skeleton state -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="flex animate-pulse items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div class="space-y-2">
            <div class="h-4 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div class="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800/60" />
          </div>
        </div>
        <div class="h-5 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="transactions.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
      >
        <i class="pi pi-history text-2xl" />
      </div>
      <h3 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
        Belum Ada Riwayat Mutasi
      </h3>
      <p class="mt-1 max-w-sm text-xs text-neutral-500 dark:text-neutral-400">
        Koin Anda akan otomatis bertambah dari bonus sambutan dan cashback 1% setiap kali pesanan
        Anda selesai.
      </p>
    </div>

    <!-- Transaction list -->
    <div
      v-else
      class="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center justify-between p-4 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"
      >
        <div class="flex items-center gap-3.5">
          <div
            :class="[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base shadow-sm',
              getTransactionBadge(tx.type).bgClass,
            ]"
          >
            <i :class="['pi', getTransactionBadge(tx.type).icon]" />
          </div>
          <div>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ tx.description }}
            </p>
            <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{{ tx.formatted_date || tx.created_at }}</span>
              <span class="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <span>Sisa: {{ new Intl.NumberFormat('id-ID').format(tx.balance_after) }} Koin</span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <span :class="['text-sm font-bold', getTransactionBadge(tx.type).amountClass]">
            {{ tx.formatted_amount }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
