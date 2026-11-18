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
        bgClass: 'bg-brand-success-tint text-brand-success-text',
        amountClass: 'text-brand-success-text',
      }
    case 'welcome_bonus':
      return {
        icon: 'pi-gift',
        bgClass: 'bg-brand-warning-tint text-brand-warning-text',
        amountClass: 'text-brand-warning-text',
      }
    case 'refunded_order':
    case 'cancelled_order':
      return {
        icon: 'pi-refresh',
        bgClass: 'bg-brand-accent-tint text-brand-accent-text',
        amountClass: 'text-brand-accent-text',
      }
    case 'redeemed_voucher':
      return {
        icon: 'pi-ticket',
        bgClass: 'bg-brand-accent-tint text-brand-accent-text',
        amountClass: 'text-brand-danger-text',
      }
    case 'spent':
    default:
      return {
        icon: 'pi-shopping-bag',
        bgClass: 'bg-brand-danger-tint text-brand-danger-text',
        amountClass: 'text-brand-danger-text',
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
        class="flex animate-pulse items-center justify-between rounded-xl border border-brand-hair bg-brand-canvas p-4"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-brand-field" />
          <div class="space-y-2">
            <div class="h-4 w-36 rounded bg-brand-field" />
            <div class="h-3 w-24 rounded bg-brand-canvas-soft" />
          </div>
        </div>
        <div class="h-5 w-20 rounded bg-brand-field" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="transactions.length === 0"
      class="flex flex-col items-center justify-center rounded-card border border-dashed border-brand-hair bg-brand-canvas-soft px-6 py-12 text-center"
    >
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-warning-tint text-brand-warning-text"
      >
        <i class="pi pi-history text-2xl" />
      </div>
      <h3 class="text-base font-bold text-brand-ink">Belum Ada Riwayat Mutasi</h3>
      <p class="mt-1 max-w-sm text-xs text-brand-muted">
        Koin Anda akan otomatis bertambah dari bonus sambutan dan cashback 1% setiap kali pesanan
        Anda selesai.
      </p>
    </div>

    <!-- Transaction list -->
    <div
      v-else
      class="divide-y divide-brand-hairsoft overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center justify-between p-4 transition-colors hover:bg-brand-field/70"
      >
        <div class="flex items-center gap-3.5">
          <div
            :class="[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base shadow-whisper',
              getTransactionBadge(tx.type).bgClass,
            ]"
          >
            <i :class="['pi', getTransactionBadge(tx.type).icon]" />
          </div>
          <div>
            <p class="text-sm font-semibold text-brand-ink">
              {{ tx.description }}
            </p>
            <div class="flex items-center gap-2 text-xs text-brand-muted">
              <span>{{ tx.formatted_date || tx.created_at }}</span>
              <span class="text-brand-faint">&bull;</span>
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
