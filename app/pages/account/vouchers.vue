<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserVouchers } from '~/composables/useUserVouchers'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import VoucherTicketCard from '~/components/account/VoucherTicketCard.vue'
import VoucherClaimInput from '~/components/account/VoucherClaimInput.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'
import UiTabs, { type UiTabItem } from '~/components/ui/UiTabs.vue'
import type { UserVoucherItem } from '~~/shared/schemas/user-voucher'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Voucher Saya - ShelfStack',
  description: 'Koleksi kupon promo diskon belanja dan voucher gratis ongkir ShelfStack Anda.',
})

const {
  claimedVouchers,
  discoverableVouchers,
  historyVouchers,
  activeCount,
  isLoading,
  isClaiming,
  error,
  fetchVouchers,
  claimVoucher,
  claimVoucherByCode,
} = useUserVouchers()

type VoucherTab = 'claimed' | 'discoverable' | 'history'
type VoucherCategoryFilter = 'all' | 'percentage' | 'fixed'

const activeTab = ref<VoucherTab>('claimed')
const categoryFilter = ref<VoucherCategoryFilter>('all')
const claimingId = ref<string | null>(null)

onMounted(async () => {
  await fetchVouchers()
})

const tabItems = computed<UiTabItem[]>(() => [
  { value: 'claimed', label: 'Voucher Saya', count: activeCount.value },
  { value: 'discoverable', label: 'Temukan Promo', count: discoverableVouchers.value.length },
  { value: 'history', label: 'Riwayat', count: historyVouchers.value.length },
])

const filterOptions: Array<{ id: VoucherCategoryFilter; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'percentage', label: 'Persentase' },
  { id: 'fixed', label: 'Potongan Tetap' },
]

const onTabChange = (val: string) => {
  if (val === 'claimed' || val === 'discoverable' || val === 'history') {
    activeTab.value = val
  }
}

const currentVouchers = computed<UserVoucherItem[]>(() => {
  if (activeTab.value === 'claimed') return claimedVouchers.value
  if (activeTab.value === 'discoverable') return discoverableVouchers.value
  return historyVouchers.value
})

const filteredVouchers = computed<UserVoucherItem[]>(() => {
  if (categoryFilter.value === 'all') return currentVouchers.value
  return currentVouchers.value.filter((v) => v.discount_type === categoryFilter.value)
})

const handleClaimCoupon = async (couponId: string) => {
  claimingId.value = couponId
  await claimVoucher(couponId)
  claimingId.value = null
}
</script>

<template>
  <div class="space-y-4 pb-16">
    <!-- Desktop Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="hidden sm:flex items-center gap-2 text-xs font-medium text-brand-muted overflow-x-auto"
    >
      <NuxtLink
        to="/"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
      >
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint" aria-hidden="true">/</span>
      <span class="text-brand-ink font-semibold">Voucher Saya</span>
    </nav>

    <!-- 2-Column Responsive Layout -->
    <div class="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-3.5">
        <!-- Compact Header -->
        <header class="pb-3.5 border-b border-brand-hair">
          <div class="flex items-center gap-2">
            <h1
              class="font-display text-lg sm:text-2xl font-bold text-brand-ink tracking-[-0.02em] m-0 [text-wrap:balance]"
            >
              Voucher Saya
            </h1>
            <span
              v-if="activeCount > 0"
              class="px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[11px] font-semibold tabular-nums"
            >
              {{ activeCount }} aktif
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 mt-1 [text-wrap:pretty]">
            Klaim kode promo dan kelola kupon diskon siap pakai saat checkout.
          </p>
        </header>

        <!-- Manual Promo Claim Bar -->
        <VoucherClaimInput :loading="isClaiming" @submit="claimVoucherByCode" />

        <!-- Single-Row Scrollable Tabs + Type Filter Chips -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <UiTabs
            :model-value="activeTab"
            :items="tabItems"
            full-width
            class="lg:w-auto"
            aria-label="Navigasi dompet voucher"
            @update:model-value="onTabChange"
          />

          <div
            class="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
            role="group"
            aria-label="Filter jenis diskon voucher"
          >
            <button
              v-for="opt in filterOptions"
              :key="opt.id"
              type="button"
              :aria-pressed="categoryFilter === opt.id"
              class="voucher-chip px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              :class="
                categoryFilter === opt.id
                  ? 'bg-brand-ink text-brand-onink border-brand-ink'
                  : 'bg-brand-canvas border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink/40'
              "
              @click="categoryFilter = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Error State -->
        <UiAlert v-if="error" variant="danger">
          {{ error }}
        </UiAlert>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" role="status" aria-busy="true" class="space-y-3">
          <span class="sr-only">Memuat daftar voucher…</span>
          <div
            v-for="i in 3"
            :key="i"
            class="p-4 rounded-card border border-brand-hair bg-brand-canvas flex items-center justify-between gap-4"
          >
            <div class="flex-1 min-w-0 space-y-2">
              <UiSkeleton width="w-28" height="h-4" />
              <UiSkeleton width="w-3/4" height="h-3.5" />
            </div>
            <UiSkeleton width="w-24" height="h-8" shape="pill" class="shrink-0" />
          </div>
        </div>

        <!-- Empty States (wired to real UiEmptyState action-label & @action) -->
        <UiEmptyState
          v-else-if="filteredVouchers.length === 0 && categoryFilter !== 'all'"
          icon="pi-filter"
          title="Tidak Ada Voucher untuk Jenis Ini"
          description="Tidak ditemukan voucher sesuai filter jenis potongan yang dipilih."
          action-label="Tampilkan Semua"
          @action="categoryFilter = 'all'"
        />

        <UiEmptyState
          v-else-if="filteredVouchers.length === 0 && activeTab === 'claimed'"
          icon="pi-ticket"
          title="Belum Ada Voucher Tersimpan"
          description="Klaim voucher promo yang tersedia di tab Temukan Promo untuk mendapatkan potongan belanja."
          action-label="Lihat Promo Tersedia"
          @action="activeTab = 'discoverable'"
        />

        <UiEmptyState
          v-else-if="filteredVouchers.length === 0 && activeTab === 'discoverable'"
          icon="pi-check-circle"
          title="Semua Promo Telah Diklaim"
          description="Anda telah mengklaim seluruh kupon promo publik yang tersedia saat ini."
          action-label="Buka Voucher Saya"
          @action="activeTab = 'claimed'"
        />

        <UiEmptyState
          v-else-if="filteredVouchers.length === 0"
          icon="pi-history"
          title="Tidak Ada Riwayat Voucher"
          description="Voucher yang telah Anda gunakan pada pesanan atau kedaluwarsa akan tercatat di sini."
        />

        <!-- List Voucher Cards -->
        <div v-else class="space-y-3">
          <VoucherTicketCard
            v-for="v in filteredVouchers"
            :key="v.id"
            :voucher="v"
            :mode="activeTab"
            :loading="claimingId === v.coupon_id"
            @claim="handleClaimCoupon"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.voucher-chip {
  touch-action: manipulation;
}

@media (pointer: coarse) {
  .voucher-chip {
    min-block-size: 36px;
    position: relative;
  }

  .voucher-chip::after {
    content: '';
    position: absolute;
    inset: -4px 0;
  }
}
</style>
