<script setup lang="ts">
import { ref } from 'vue'
import { useAdminUsers } from '~/composables/useAdminUsers'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminUserMetrics from '~/components/admin/users/AdminUserMetrics.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import AdminCustomer360Drawer from '~/components/admin/users/AdminCustomer360Drawer.vue'
import type { AdminCustomerSummary } from '~~/shared/types/admin-crm'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({
  title: 'CRM Pelanggan & LTV - ShelfStack Admin',
  description:
    'Kelola basis data pelanggan resmi ShelfStack, pantau Customer Lifetime Value (LTV), dan riwayat belanja.',
})

const {
  customers,
  metrics,
  loading,
  error,
  searchQuery,
  selectedSort,
  currentPage,
  totalPages,
  totalCustomersCount,
  sortOptions,
  hasCustomers,
  fetchCustomers,
} = useAdminUsers()

const selectedCustomer = ref<AdminCustomerSummary | null>(null)
const isDetailDrawerOpen = ref(false)

const openCustomerDetail = (customer: AdminCustomerSummary) => {
  selectedCustomer.value = customer
  isDetailDrawerOpen.value = true
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="admin-users-page space-y-5">
    <AdminPageHeader
      title="Pelanggan & Customer Lifetime Value"
      subtitle="Daftar pelanggan terdaftar, total pesanan, dan akumulasi nilai belanja."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Pelanggan & CRM' }]"
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchCustomers"
        >
          Segarkan Data
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Executive Metrics Grid -->
    <AdminUserMetrics :metrics="metrics" />

    <!-- Toolbar Filters -->
    <div
      class="flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="w-full sm:max-w-xs">
        <label for="admin-users-search" class="sr-only">Cari nama atau email pelanggan</label>
        <UiInput
          id="admin-users-search"
          v-model="searchQuery"
          size="sm"
          type="search"
          left-icon="pi-search"
          placeholder="Cari nama atau email..."
        />
      </div>
      <div class="flex items-center gap-2">
        <UiSelect v-model="selectedSort" size="sm" prefix="Urutkan:" :options="sortOptions" pill />
      </div>
    </div>

    <!-- Customers Table Card -->
    <UiCard :padded="false" class="overflow-hidden">
      <!-- Error state -->
      <div v-if="error" class="p-6 text-center text-xs text-brand-danger-text">
        <i class="pi pi-exclamation-circle text-lg mb-1 block" aria-hidden="true" />
        <p class="m-0 font-medium">{{ error }}</p>
        <UiButton size="xs" variant="outline" class="mt-2" @click="fetchCustomers"
          >Coba Lagi</UiButton
        >
      </div>

      <!-- Loading skeleton state -->
      <div v-else-if="loading && !hasCustomers" class="p-4 space-y-3" aria-busy="true">
        <div v-for="i in 5" :key="i" class="h-12 w-full animate-pulse rounded-lg bg-brand-field" />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="!hasCustomers"
        title="Tidak Ada Pelanggan Ditemukan"
        description="Tidak ada data akun pelanggan yang sesuai dengan kriteria pencarian Anda."
        icon="pi-users"
      />

      <!-- Table View -->
      <div
        v-else
        tabindex="0"
        role="region"
        aria-label="Tabel data pelanggan dan LTV"
        class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
      >
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas-soft text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th scope="col" class="py-2.5 px-3.5 font-semibold">Pelanggan</th>
              <th scope="col" class="py-2.5 px-3.5 font-semibold">Terdaftar</th>
              <th scope="col" class="py-2.5 px-3.5 font-semibold text-center">Total Pesanan</th>
              <th scope="col" class="py-2.5 px-3.5 font-semibold text-right">
                Nilai Belanja (LTV)
              </th>
              <th scope="col" class="py-2.5 px-3.5 font-semibold">Pesanan Terakhir</th>
              <th scope="col" class="py-2.5 px-3.5 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
            <tr
              v-for="c in customers"
              :key="c.userId"
              class="hover:bg-brand-canvas-soft/40 transition-colors"
            >
              <td class="py-2.5 px-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-field text-brand-ink font-bold text-xs border border-brand-hair"
                  >
                    <img
                      v-if="c.avatarUrl"
                      :src="c.avatarUrl"
                      :alt="c.fullName"
                      class="h-full w-full rounded-full object-cover"
                    />
                    <span v-else>{{ c.fullName.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-brand-ink m-0 truncate">{{ c.fullName }}</p>
                    <p class="text-[11px] text-brand-muted m-0 truncate">{{ c.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-2.5 px-3.5 text-brand-muted whitespace-nowrap">
                {{ formatDate(c.createdAt) }}
              </td>
              <td class="py-2.5 px-3.5 text-center">
                <UiBadge :label="`${c.totalOrders} order`" variant="default" />
              </td>
              <td class="py-2.5 px-3.5 text-right">
                <span class="font-display font-bold text-sm text-brand-ink tabular">{{
                  c.formattedLtv
                }}</span>
                <span
                  v-if="c.completedOrders > 0"
                  class="block text-[10.5px] text-brand-success-text font-medium"
                >
                  {{ c.completedOrders }} lunas
                </span>
              </td>
              <td class="py-2.5 px-3.5 text-brand-muted whitespace-nowrap">
                {{ formatDate(c.lastOrderAt) }}
              </td>
              <td class="py-2.5 px-3.5 text-center">
                <UiButton size="xs" variant="outline" icon="pi-eye" @click="openCustomerDetail(c)">
                  Rincian
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-between gap-2 border-t border-brand-hair bg-brand-canvas-soft/60 px-4 py-2.5 text-xs text-brand-muted"
      >
        <span
          >Menampilkan halaman {{ currentPage }} dari {{ totalPages }} (Total
          {{ totalCustomersCount }} pelanggan)</span
        >
        <div class="flex items-center gap-1.5">
          <UiButton
            size="xs"
            variant="outline"
            :disabled="currentPage <= 1 || loading"
            @click="currentPage--"
          >
            Sebelumnya
          </UiButton>
          <UiButton
            size="xs"
            variant="outline"
            :disabled="currentPage >= totalPages || loading"
            @click="currentPage++"
          >
            Selanjutnya
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Customer 360 Slide-Over Drawer -->
    <AdminCustomer360Drawer
      v-model:visible="isDetailDrawerOpen"
      :user-id="selectedCustomer?.userId || null"
      :fallback-customer="selectedCustomer"
    />
  </div>
</template>
