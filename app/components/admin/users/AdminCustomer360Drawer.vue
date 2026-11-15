<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Customer360Detail, AdminCustomerSummary } from '~~/shared/types/admin-crm'

const props = defineProps<{
  visible: boolean
  userId: string | null
  fallbackCustomer?: AdminCustomerSummary | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const router = useRouter()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const customerDetail = ref<Customer360Detail | null>(null)

const fetchCustomer360 = async (id: string) => {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ data: Customer360Detail }>(`/api/admin/users/${id}/360`)
    if (res && res.data) {
      customerDetail.value = res.data
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat profil Customer 360'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.userId],
  ([isVisible, currentId]) => {
    if (isVisible && currentId && typeof currentId === 'string') {
      void fetchCustomer360(currentId)
    }
  },
  { immediate: true },
)

const handleClose = () => {
  emit('update:visible', false)
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

const getOrderBadgeVariant = (
  status: string,
): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'danger'
    case 'shipped':
      return 'info'
    default:
      return 'warning'
  }
}

const navigateToOrder = (orderId: string) => {
  handleClose()
  router.push(`/admin/orders/${orderId}`)
}

const navigateToSupport = () => {
  handleClose()
  router.push('/admin/support')
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
    <!-- Backdrop Blur Overlay -->
    <div
      class="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm transition-opacity"
      @click="handleClose"
    />

    <!-- Slide-Over Drawer Container -->
    <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
      <div
        class="w-screen max-w-md bg-brand-canvas shadow-floating border-l border-brand-hair flex flex-col justify-between"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-brand-hairsoft">
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent"
            >
              <i class="pi pi-user text-xs" />
            </span>
            <h2 class="font-display text-base font-bold text-brand-ink m-0">Customer 360° View</h2>
          </div>
          <UiIconButton
            icon="pi-times"
            label="Tutup Profil 360"
            variant="neutral"
            size="sm"
            @click="handleClose"
          />
        </div>

        <!-- Body / Content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-6">
          <!-- Loading State -->
          <div v-if="loading" class="space-y-4 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-brand-hairsoft" />
              <div class="space-y-1.5 flex-1">
                <div class="h-4 w-32 bg-brand-hairsoft rounded" />
                <div class="h-3 w-48 bg-brand-hairsoft rounded" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div v-for="i in 4" :key="i" class="h-16 rounded-xl bg-brand-hairsoft" />
            </div>
          </div>

          <!-- Error Alert State -->
          <UiAlert v-else-if="errorMessage" variant="danger" title="Gagal Memuat">
            <p class="m-0 text-xs">{{ errorMessage }}</p>
            <UiButton
              v-if="userId"
              size="xs"
              variant="outline"
              class="mt-2"
              @click="fetchCustomer360(userId)"
            >
              Coba Lagi
            </UiButton>
          </UiAlert>

          <!-- Customer Data Ready State -->
          <template v-else-if="customerDetail || fallbackCustomer">
            <!-- Profile Identity -->
            <div class="flex items-center gap-3 pb-2">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-ink text-white font-bold text-base shadow-sm"
              >
                <span>{{
                  (customerDetail?.fullName || fallbackCustomer?.fullName || 'U')
                    .charAt(0)
                    .toUpperCase()
                }}</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-display text-base font-bold text-brand-ink truncate m-0">
                    {{ customerDetail?.fullName || fallbackCustomer?.fullName }}
                  </h3>
                  <UiBadge
                    :label="customerDetail?.role || fallbackCustomer?.role || 'Customer'"
                    variant="default"
                  />
                </div>
                <p class="text-xs text-brand-muted truncate m-0 mt-0.5">
                  {{ customerDetail?.email || fallbackCustomer?.email || 'Email terdaftar' }}
                </p>
              </div>
            </div>

            <!-- Financial Metrics Grid -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3.5 rounded-xl border border-brand-hair bg-brand-canvas-soft">
                <span class="text-[11px] font-medium text-brand-muted block">Lifetime Value</span>
                <span class="font-display text-base font-bold text-brand-ink block mt-0.5 tabular">
                  {{ customerDetail?.formattedLtv || fallbackCustomer?.formattedLtv || 'Rp 0' }}
                </span>
              </div>

              <div class="p-3.5 rounded-xl border border-brand-hair bg-brand-canvas-soft">
                <span class="text-[11px] font-medium text-brand-muted block"
                  >Rata-rata Pesanan</span
                >
                <span class="font-display text-base font-bold text-brand-ink block mt-0.5 tabular">
                  {{ customerDetail?.formattedAov || 'Rp 0' }}
                </span>
              </div>

              <div class="p-3.5 rounded-xl border border-brand-hair bg-brand-canvas-soft">
                <span class="text-[11px] font-medium text-brand-muted block">Pesanan Selesai</span>
                <span
                  class="font-display text-base font-bold text-brand-success-text block mt-0.5 tabular"
                >
                  {{ customerDetail?.completedOrders || fallbackCustomer?.completedOrders || 0 }} /
                  {{ customerDetail?.totalOrders || fallbackCustomer?.totalOrders || 0 }}
                </span>
              </div>

              <div class="p-3.5 rounded-xl border border-brand-hair bg-brand-canvas-soft">
                <span class="text-[11px] font-medium text-brand-muted block">Saldo Koin</span>
                <span
                  class="font-display text-base font-bold text-brand-warning-text block mt-0.5 tabular"
                >
                  {{ (customerDetail?.loyaltyCoinBalance || 0).toLocaleString('id-ID') }} Koin
                </span>
              </div>
            </div>

            <!-- Recent Orders Section -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <h4
                  class="font-display text-xs font-bold text-brand-ink uppercase tracking-wider m-0"
                >
                  Histori 5 Pesanan Terakhir
                </h4>
                <span class="text-[11px] text-brand-muted">
                  Total: {{ customerDetail?.totalOrders || 0 }}
                </span>
              </div>

              <div
                v-if="customerDetail && customerDetail.recentOrders.length > 0"
                class="divide-y divide-brand-hairsoft rounded-xl border border-brand-hair bg-brand-canvas-soft"
              >
                <div
                  v-for="order in customerDetail.recentOrders"
                  :key="order.id"
                  class="p-3 flex items-center justify-between text-xs hover:bg-brand-canvas cursor-pointer transition-colors"
                  @click="navigateToOrder(order.id)"
                >
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="font-semibold text-brand-ink tabular"
                        >#{{ order.id.slice(0, 8).toUpperCase() }}</span
                      >
                      <UiBadge
                        :label="order.status"
                        :variant="getOrderBadgeVariant(order.status)"
                      />
                    </div>
                    <p class="text-[11px] text-brand-muted m-0">
                      {{ formatDate(order.createdAt) }} · {{ order.itemCount }} produk
                    </p>
                  </div>
                  <span class="font-bold tabular text-brand-ink">{{ order.formattedTotal }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-brand-muted italic m-0">
                Belum ada transaksi pesanan yang tercatat.
              </p>
            </div>
          </template>
        </div>

        <!-- Footer Actions -->
        <div class="p-5 border-t border-brand-hairsoft bg-brand-canvas-soft flex gap-2.5">
          <UiButton
            variant="outline"
            size="sm"
            icon="pi-comments"
            class="flex-1 justify-center"
            @click="navigateToSupport"
          >
            Live Chat
          </UiButton>
          <UiButton variant="primary" size="sm" class="flex-1 justify-center" @click="handleClose">
            Selesai
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
