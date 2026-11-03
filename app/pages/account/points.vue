<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoyaltyPoints } from '~/composables/useLoyaltyPoints'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import CoinBalanceCard from '~/components/account/points/CoinBalanceCard.vue'
import CoinVoucherExchangeGrid from '~/components/account/points/CoinVoucherExchangeGrid.vue'
import CoinTransactionList from '~/components/account/points/CoinTransactionList.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiButton from '~/components/ui/UiButton.vue'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Koin & Rewards - ShelfStack',
  description:
    'Kelola saldo koin loyalitas ShelfStack, tukar voucher diskon eksklusif, dan pantau riwayat transaksi cashback.',
})

const {
  summary,
  catalog,
  isLoading,
  isClaimingWelcome,
  isExchanging,
  error,
  balanceCoins,
  formattedBalance,
  formattedRupiah,
  hasClaimedWelcome,
  transactions,
  exchangeCatalog,
  fetchPointsSummary,
  fetchExchangeCatalog,
  claimWelcomeBonus,
  exchangeForVoucher,
} = useLoyaltyPoints()

const activeTab = ref<'exchange' | 'transactions'>('exchange')

onMounted(async () => {
  await Promise.all([fetchPointsSummary(), fetchExchangeCatalog()])
})

const handleRefresh = async () => {
  await Promise.all([fetchPointsSummary(), fetchExchangeCatalog()])
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium text-brand-muted"
    >
      <NuxtLink to="/" class="text-brand-muted no-underline transition-colors hover:text-brand-ink">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="font-semibold text-brand-ink">Koin & Rewards</span>
    </nav>

    <!-- 2-Column Responsive Layout -->
    <div class="flex flex-col items-start gap-6 xl:flex-row">
      <AccountSidebar />

      <!-- Right Main Content Panel -->
      <div class="w-full min-w-0 flex-1 space-y-6">
        <!-- Error alert if any -->
        <UiAlert v-if="error" variant="error">
          <div class="flex items-center justify-between">
            <span>{{ error }}</span>
            <UiButton size="sm" variant="secondary" @click="handleRefresh"> Coba Lagi </UiButton>
          </div>
        </UiAlert>

        <!-- Balance Card -->
        <CoinBalanceCard
          :balance-coins="balanceCoins"
          :formatted-balance="formattedBalance"
          :formatted-rupiah="formattedRupiah"
          :lifetime-earned="summary?.lifetime_earned_coins || 0"
          :lifetime-spent="summary?.lifetime_spent_coins || 0"
          :has-claimed-welcome="hasClaimedWelcome"
          :is-claiming-welcome="isClaimingWelcome"
          @claim-welcome="claimWelcomeBonus"
        />

        <!-- Tab Navigasi Koin -->
        <div
          class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper sm:p-5"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-hairsoft pb-3"
          >
            <div class="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                class="min-h-[40px] cursor-pointer rounded-field border-0 px-3.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                :class="
                  activeTab === 'exchange'
                    ? 'bg-amber-600 text-white shadow-whisper'
                    : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink'
                "
                @click="activeTab = 'exchange'"
              >
                Tukar Voucher ({{ exchangeCatalog.length }})
              </button>

              <button
                type="button"
                class="min-h-[40px] cursor-pointer rounded-field border-0 px-3.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                :class="
                  activeTab === 'transactions'
                    ? 'bg-brand-ink text-white shadow-whisper'
                    : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink'
                "
                @click="activeTab = 'transactions'"
              >
                Riwayat Transaksi ({{ transactions.length }})
              </button>
            </div>

            <button
              type="button"
              class="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              :disabled="isLoading"
              @click="handleRefresh"
            >
              <i class="pi pi-refresh text-xs" :class="{ 'animate-spin': isLoading }" />
              <span>Segarkan</span>
            </button>
          </div>

          <!-- Tab Content Views -->
          <div class="pt-5">
            <CoinVoucherExchangeGrid
              v-if="activeTab === 'exchange'"
              :catalog="exchangeCatalog"
              :user-balance="balanceCoins"
              :is-exchanging="isExchanging"
              :is-loading="isLoading"
              @exchange="exchangeForVoucher"
            />

            <CoinTransactionList v-else :transactions="transactions" :is-loading="isLoading" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
