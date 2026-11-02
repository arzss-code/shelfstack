<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserVouchers } from '~/composables/useUserVouchers'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import VoucherTicketCard from '~/components/account/VoucherTicketCard.vue'
import VoucherClaimInput from '~/components/account/VoucherClaimInput.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiButton from '~/components/ui/UiButton.vue'
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

const activeTab = ref<'claimed' | 'discoverable' | 'history'>('claimed')
const categoryFilter = ref<'all' | 'percentage' | 'fixed'>('all')
const claimingId = ref<string | null>(null)

onMounted(async () => {
  await fetchVouchers()
})

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
  <div class="space-y-6 pb-16">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Voucher Saya</span>
    </nav>

    <!-- 2-Column Responsive Layout (Sidebar on xl, Horizontal Tabs on < xl) -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <!-- Right Main Content Panel -->
      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Banner Klaim Kode Promo Manual -->
        <VoucherClaimInput :loading="isClaiming" @submit="claimVoucherByCode" />

        <!-- Tab Navigasi Dompet Voucher -->
        <div
          class="bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-5 shadow-whisper"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-brand-hairsoft pb-3 flex-wrap"
          >
            <div class="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-field text-xs font-bold transition-all cursor-pointer border-0"
                :class="
                  activeTab === 'claimed'
                    ? 'bg-brand-ink text-white shadow-whisper'
                    : 'text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
                "
                @click="activeTab = 'claimed'"
              >
                Voucher Saya ({{ activeCount }})
              </button>

              <button
                type="button"
                class="px-3 py-1.5 rounded-field text-xs font-bold transition-all cursor-pointer border-0"
                :class="
                  activeTab === 'discoverable'
                    ? 'bg-brand-ink text-white shadow-whisper'
                    : 'text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
                "
                @click="activeTab = 'discoverable'"
              >
                Temukan Promo ({{ discoverableVouchers.length }})
              </button>

              <button
                type="button"
                class="px-3 py-1.5 rounded-field text-xs font-bold transition-all cursor-pointer border-0"
                :class="
                  activeTab === 'history'
                    ? 'bg-brand-ink text-white shadow-whisper'
                    : 'text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
                "
                @click="activeTab = 'history'"
              >
                Riwayat ({{ historyVouchers.length }})
              </button>
            </div>

            <!-- Filter Chips Kategori -->
            <div class="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                class="px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                :class="
                  categoryFilter === 'all'
                    ? 'bg-white border-brand-ink text-brand-ink font-bold shadow-whisper'
                    : 'border-brand-hair text-brand-muted hover:text-brand-ink'
                "
                @click="categoryFilter = 'all'"
              >
                Semua
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                :class="
                  categoryFilter === 'percentage'
                    ? 'bg-white border-brand-ink text-brand-ink font-bold shadow-whisper'
                    : 'border-brand-hair text-brand-muted hover:text-brand-ink'
                "
                @click="categoryFilter = 'percentage'"
              >
                Persentase
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                :class="
                  categoryFilter === 'fixed'
                    ? 'bg-white border-brand-ink text-brand-ink font-bold shadow-whisper'
                    : 'border-brand-hair text-brand-muted hover:text-brand-ink'
                "
                @click="categoryFilter = 'fixed'"
              >
                Potongan Tetap
              </button>
            </div>
          </div>

          <!-- Alert Error State -->
          <UiAlert v-if="error" variant="danger" class="mt-4">
            {{ error }}
          </UiAlert>

          <!-- Loading State: Skeleton Cards -->
          <div v-if="isLoading" class="space-y-3.5 mt-4">
            <div
              v-for="i in 3"
              :key="i"
              class="h-28 bg-brand-canvas-soft rounded-card animate-pulse border border-brand-hairsoft"
            />
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredVouchers.length === 0" class="py-8">
            <UiEmptyState
              v-if="activeTab === 'claimed'"
              icon="pi pi-ticket"
              title="Belum Ada Voucher Tersimpan"
              description="Klaim voucher promo yang tersedia di tab Temukan Promo untuk mendapatkan potongan belanja."
            >
              <template #action>
                <UiButton
                  variant="primary"
                  size="sm"
                  class="mt-2"
                  @click="activeTab = 'discoverable'"
                >
                  Lihat Promo Tersedia
                </UiButton>
              </template>
            </UiEmptyState>

            <UiEmptyState
              v-else-if="activeTab === 'discoverable'"
              icon="pi pi-check-circle"
              title="Semua Promo Telah Diklaim"
              description="Anda telah mengklaim seluruh kupon promo publik yang tersedia saat ini."
            >
              <template #action>
                <UiButton variant="secondary" size="sm" class="mt-2" @click="activeTab = 'claimed'">
                  Buka Voucher Saya
                </UiButton>
              </template>
            </UiEmptyState>

            <UiEmptyState
              v-else
              icon="pi pi-history"
              title="Tidak Ada Riwayat Voucher"
              description="Voucher yang telah Anda gunakan pada pesanan atau kedaluwarsa akan tercatat di sini."
            />
          </div>

          <!-- List Voucher Cards -->
          <div v-else class="space-y-3.5 mt-4">
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
  </div>
</template>
