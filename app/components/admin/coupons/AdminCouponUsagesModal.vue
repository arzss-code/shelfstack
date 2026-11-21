<script setup lang="ts">
import { ref, watch } from 'vue'
import UiModal from '~/components/ui/UiModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import type { AdminCoupon } from './AdminCouponTable.vue'

interface CouponUsageItem {
  id: string
  order_id: string
  user_id: string
  discount_cents: number
  formatted_discount: string
  order_total_cents: number
  formatted_order_total: string
  order_status: string
  created_at: string
}

const props = defineProps<{
  visible: boolean
  coupon: AdminCoupon | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'close'): void
}>()

const usages = ref<CouponUsageItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const formatDate = (isoString: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const getOrderStatusTone = (status: string) => {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'success'
    case 'processing':
    case 'shipped':
      return 'info'
    case 'cancelled':
    case 'refunded':
      return 'danger'
    case 'pending':
    default:
      return 'warning'
  }
}

const fetchUsages = async (couponId: string) => {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{
      status: string
      data: { usages: CouponUsageItem[] }
    }>(`/api/admin/coupons/${couponId}/usages`)

    if (res?.data) {
      usages.value = res.data.usages
    }
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } }
    error.value = errObj?.data?.message || 'Gagal memuat riwayat pemakaian voucher.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen && props.coupon?.id) {
      fetchUsages(props.coupon.id)
    } else {
      usages.value = []
      error.value = null
    }
  },
)
</script>

<template>
  <UiModal
    :visible="visible"
    size="lg"
    :title="coupon ? `Riwayat Pemakaian: ${coupon.code}` : 'Riwayat Pemakaian Voucher'"
    :description="
      coupon
        ? `Daftar transaksi pesanan yang telah menggunakan voucher ${coupon.name}.`
        : 'Rincian audit transaksi pesanan voucher.'
    "
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-2 p-8 text-center">
        <i class="pi pi-spinner animate-spin text-xl text-brand-muted" aria-hidden="true" />
        <p class="text-xs text-brand-muted">Memuat riwayat transaksi...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="rounded-xl border border-brand-danger-edge bg-brand-danger-tint p-4 text-xs text-brand-danger-text"
      >
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="usages.length === 0" class="p-6">
        <UiEmptyState
          icon="pi-inbox"
          title="Belum ada transaksi"
          description="Voucher ini belum pernah digunakan pada pesanan pelanggan mana pun."
        />
      </div>

      <!-- Usages Table -->
      <div
        v-else
        class="max-h-[380px] overflow-x-auto overflow-y-auto rounded-xl border border-brand-hair bg-brand-canvas"
      >
        <table class="w-full text-left text-xs" role="table">
          <thead
            class="sticky top-0 border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >
            <tr>
              <th scope="col" class="px-3.5 py-2.5">Pesanan</th>
              <th scope="col" class="px-3.5 py-2.5">Potongan Diskon</th>
              <th scope="col" class="px-3.5 py-2.5">Total Belanja</th>
              <th scope="col" class="px-3.5 py-2.5">Status Order</th>
              <th scope="col" class="px-3.5 py-2.5">Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="item in usages"
              :key="item.id"
              class="transition-colors hover:bg-brand-canvas-soft/40"
            >
              <td class="px-3.5 py-3">
                <NuxtLink
                  :to="`/admin/orders/${item.order_id}`"
                  class="font-mono font-medium text-brand-ink underline transition-colors hover:text-brand-accent"
                >
                  {{ item.order_id.slice(0, 8) }}...
                </NuxtLink>
              </td>

              <td class="px-3.5 py-3 font-semibold tabular text-brand-accent">
                {{ item.formatted_discount }}
              </td>

              <td class="px-3.5 py-3 tabular text-brand-muted">
                {{ item.formatted_order_total }}
              </td>

              <td class="px-3.5 py-3">
                <UiBadge
                  :label="item.order_status"
                  :variant="getOrderStatusTone(item.order_status)"
                />
              </td>

              <td class="px-3.5 py-3 text-brand-muted">
                {{ formatDate(item.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <UiButton variant="primary" size="sm" @click="emit('close')"> Tutup </UiButton>
    </template>
  </UiModal>
</template>
