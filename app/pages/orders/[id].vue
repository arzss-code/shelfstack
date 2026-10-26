<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import OrderCancelDialog from '~/features/orders/components/OrderCancelDialog.vue'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'
import type { RealtimeChannel } from '@supabase/supabase-js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const toast = useUiToast()
const config = useRuntimeConfig()
const { pay: openSnapModal } = useMidtransSnap()

const orderId = route.params.id as string
const order = ref<Order | null>(null)
const loading = ref(true)
const isPaying = ref(false)
const isCancelling = ref(false)
const isManualChecking = ref(false)
const isSilentChecking = ref(false)
const isCancelModalOpen = ref(false)

const isInvoiceModalOpen = ref(false)
const errorMsg = ref('')

definePageMeta({
  middleware: 'auth',
})

let channel: RealtimeChannel | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null

useSeoMeta({
  title: () =>
    order.value
      ? `Pesanan #${order.value.id.slice(0, 8)} - ShelfStack`
      : 'Detail Pesanan - ShelfStack',
  description: 'Detail informasi dan status pemesanan produk resmi di ShelfStack.',
})

const startPolling = () => {
  if (pollInterval || !import.meta.client) return
  pollInterval = setInterval(async () => {
    if (!order.value || order.value.status !== 'pending') {
      stopPolling()
      return
    }
    // Hanya polling ketika tab aktif untuk efisiensi resource jaringan
    if (document.visibilityState === 'visible') {
      await handleCheckPaymentStatus(true)
    }
  }, 3500)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const handleVisibilityOrFocusChange = () => {
  if (document.visibilityState === 'visible' && order.value?.status === 'pending') {
    handleCheckPaymentStatus(true)
  }
}

const fetchOrderDetail = async (silent = false) => {
  if (!user.value) {
    router.push(`/auth/login?redirect=/orders/${orderId}`)
    return
  }

  if (!silent) {
    loading.value = true
  }
  errorMsg.value = ''

  try {
    const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId}`)
    order.value = res.data
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMsg.value = fetchErr.data?.message || 'Pesanan tidak ditemukan atau akses ditolak.'
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

onMounted(async () => {
  await fetchOrderDetail()

  // Jika pesanan masih pending, sinkronisasi status otomatis dan mulai polling di background
  if (order.value?.status === 'pending') {
    handleCheckPaymentStatus(true)
    startPolling()
  }

  // Langganan pembaruan status realtime via Supabase Realtime Postgres Changes
  if (order.value && import.meta.client) {
    channel = supabase
      .channel(`order-realtime-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && order.value) {
            const updated = payload.new as Record<string, unknown>
            const prevStatus = order.value.status
            const nextStatus = updated.status as OrderStatus

            order.value = {
              ...order.value,
              status: nextStatus,
              payment_type: (updated.payment_type as string) || order.value.payment_type,
              paid_at: (updated.paid_at as string) || order.value.paid_at,
            }

            if (nextStatus !== 'pending') {
              stopPolling()
            }

            if (prevStatus === 'pending' && nextStatus === 'paid') {
              toast.add({
                severity: 'success',
                summary: 'Pembayaran Terkonfirmasi!',
                detail: 'Status pesanan berhasil diperbarui menjadi Lunas secara realtime.',
                life: 5000,
              })
              fetchOrderDetail(true)
            }
          }
        },
      )
      .subscribe()

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.addEventListener('focus', handleVisibilityOrFocusChange)
  }
})

onUnmounted(() => {
  stopPolling()
  if (channel) {
    supabase.removeChannel(channel)
  }
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.removeEventListener('focus', handleVisibilityOrFocusChange)
  }
})

const handleCheckPaymentStatus = async (silent = false) => {
  if (!order.value) return
  if (silent) {
    if (isSilentChecking.value) return
    isSilentChecking.value = true
  } else {
    if (isManualChecking.value) return
    isManualChecking.value = true
  }

  try {
    const res = await $fetch<{
      status: string
      data: {
        status: OrderStatus
        is_paid: boolean
        transaction_status?: string
        payment_type?: string
      }
    }>(`/api/orders/${order.value.id}/check-payment-status`, {
      method: 'POST',
    })

    if (res.data?.is_paid) {
      stopPolling()
      const wasPending = order.value.status === 'pending'
      order.value.status = 'paid'
      if (res.data.payment_type) {
        order.value.payment_type = res.data.payment_type
      }
      if (wasPending) {
        toast.add({
          severity: 'success',
          summary: 'Pembayaran Terkonfirmasi!',
          detail: 'Status pesanan Anda telah berhasil dikonfirmasi sebagai Lunas (Paid).',
          life: 5000,
        })
      }
      await fetchOrderDetail(true)
    } else if (!silent) {
      toast.add({
        severity: 'info',
        summary: 'Menunggu Pembayaran',
        detail:
          'Pembayaran belum terkonfirmasi oleh sistem Midtrans. Silakan selesaikan pembayaran sesuai instruksi.',
        life: 4000,
      })
    }
  } catch (err: unknown) {
    if (!silent) {
      toast.add({
        severity: 'warn',
        summary: 'Gagal Memeriksa Status',
        detail:
          'Tidak dapat memeriksa status pembayaran ke payment gateway. Silakan coba kembali sesaat lagi.',
        life: 4000,
      })
    }
  } finally {
    if (silent) {
      isSilentChecking.value = false
    } else {
      isManualChecking.value = false
    }
  }
}

const handlePayNow = async () => {
  if (!order.value || isPaying.value) return

  if (!config.public.enableMidtransSandbox) {
    toast.add({
      severity: 'warn',
      summary: 'Sandbox Nonaktif',
      detail: 'Fitur pembayaran Midtrans Sandbox saat ini dinonaktifkan.',
      life: 4000,
    })
    return
  }

  isPaying.value = true

  try {
    const res = await $fetch<{
      status: string
      data: { token: string; redirect_url?: string }
    }>(`/api/orders/${order.value.id}/payment-token`, {
      method: 'POST',
    })

    const snapToken = res.data.token

    openSnapModal(snapToken, {
      onSuccess: () => {
        toast.add({
          severity: 'success',
          summary: 'Pembayaran Diterima',
          detail: 'Memverifikasi status pembayaran dengan payment gateway...',
          life: 4000,
        })
        handleCheckPaymentStatus(true)
      },
      onPending: () => {
        startPolling()
        toast.add({
          severity: 'info',
          summary: 'Menunggu Pembayaran',
          detail:
            'Instruksi pembayaran telah aktif. Status akan otomatis diperbarui begitu transfer diterima.',
          life: 5000,
        })
      },
      onError: () => {
        toast.add({
          severity: 'error',
          summary: 'Pembayaran Gagal',
          detail: 'Terjadi kesalahan saat memproses pembayaran Sandbox.',
          life: 4000,
        })
      },
      onClose: () => {
        if (order.value?.status === 'pending') {
          startPolling()
          handleCheckPaymentStatus(true)
        }
      },
    })
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      severity: 'error',
      summary: 'Gagal Membuka Pembayaran',
      detail:
        fetchErr.data?.message ||
        'Layanan pembayaran sedang mengalami kendala. Silakan coba beberapa saat lagi.',
      life: 5000,
    })
  } finally {
    isPaying.value = false
  }
}

const handleCancelOrder = async (reason: string) => {
  if (!order.value || isCancelling.value) return
  isCancelling.value = true
  try {
    await $fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      body: { reason },
    })
    toast.add({
      severity: 'success',
      summary: 'Pesanan Dibatalkan',
      detail: 'Pesanan berhasil dibatalkan dan persediaan stok telah dikembalikan.',
      life: 5000,
    })
    isCancelModalOpen.value = false
    await fetchOrderDetail()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      severity: 'error',
      summary: 'Gagal Membatalkan',
      detail: fetchErr.data?.message || 'Terjadi kesalahan saat membatalkan pesanan.',
      life: 5000,
    })
  } finally {
    isCancelling.value = false
  }
}

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return { variant: 'success' as const, label: 'Lunas' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Sedang Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Pesanan Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

interface OrderStep {
  title: string
  description: string
  timestamp?: string
  isCompleted: boolean
  isActive: boolean
}

const orderSteps = computed<OrderStep[]>(() => {
  if (!order.value) return []

  const status = order.value.status
  const isPaid = ['paid', 'shipped', 'completed'].includes(status)
  const isShipped = ['shipped', 'completed'].includes(status)
  const isCompleted = status === 'completed'
  const isPending = status === 'pending'

  return [
    {
      title: 'Dipesan',
      description: 'Pesanan resmi dibuat',
      timestamp: formatDate(order.value.created_at),
      isCompleted: true,
      isActive: isPending,
    },
    {
      title: 'Dibayar',
      description: isPaid ? 'Pembayaran terverifikasi' : 'Menunggu pembayaran',
      timestamp: order.value.paid_at ? formatDate(order.value.paid_at) : undefined,
      isCompleted: isPaid,
      isActive: isPending,
    },
    {
      title: 'Dikirim',
      description: isShipped
        ? 'Pesanan dalam pengiriman'
        : isPaid
          ? 'Sedang disiapkan seller'
          : 'Menunggu diproses',
      isCompleted: isShipped,
      isActive: isPaid && !isShipped,
    },
    {
      title: 'Selesai',
      description: isCompleted ? 'Pesanan telah diterima' : 'Konfirmasi penerimaan',
      isCompleted: isCompleted,
      isActive: isShipped && !isCompleted,
    },
  ]
})

const progressLineWidth = computed(() => {
  if (!order.value || order.value.status === 'cancelled') return '0%'
  switch (order.value.status) {
    case 'completed':
      return '100%'
    case 'shipped':
      return '66.66%'
    case 'paid':
      return '33.33%'
    case 'pending':
    default:
      return '16.66%'
  }
})
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 border-b border-brand-hairsoft overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <NuxtLink
        to="/orders"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
      >
        Pesanan Saya
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Detail Pesanan</span>
    </nav>

    <!-- Error State -->
    <div
      v-if="errorMsg"
      class="text-center py-16 px-6 bg-red-50 border border-red-200 rounded-card max-w-lg mx-auto space-y-4"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-600" />
      <h2 class="font-display text-lg font-bold text-red-900 m-0">Gagal Memuat Pesanan</h2>
      <p class="text-xs text-red-700 m-0">{{ errorMsg }}</p>
      <UiButton to="/orders" variant="secondary" size="sm"> Kembali ke Riwayat Pesanan </UiButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading" class="space-y-6 animate-pulse">
      <div class="h-16 bg-brand-field rounded-card" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 h-80 bg-brand-field rounded-card" />
        <div class="lg:col-span-4 h-60 bg-brand-field rounded-card" />
      </div>
    </div>

    <!-- Order Detail View -->
    <div v-else-if="order" class="space-y-6">
      <!-- Top Order Header -->
      <div
        class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0">
              Pesanan #{{ order.id.slice(0, 8) }}
            </h1>
            <UiBadge
              :variant="getStatusBadge(order.status).variant"
              :label="getStatusBadge(order.status).label"
            />
          </div>
          <p class="font-body text-xs text-brand-muted m-0 mt-1">
            Dibuat pada {{ formatDate(order.created_at) }}
            <span v-if="order.paid_at"> · Dibayar pada {{ formatDate(order.paid_at) }}</span>
          </p>
        </div>
      </div>

      <!-- Timeline Status Progress -->
      <div class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-brand-hairsoft">
          <div class="flex items-center gap-2">
            <i class="pi pi-compass text-brand-accent text-sm" />
            <h2 class="font-display text-sm font-bold text-brand-ink m-0">Status Alur Transaksi</h2>
          </div>
          <span class="text-[11px] text-brand-muted">
            {{
              order.status === 'cancelled'
                ? 'Transaksi Dibatalkan'
                : getStatusBadge(order.status).label
            }}
          </span>
        </div>

        <!-- Cancelled State Alert -->
        <div
          v-if="order.status === 'cancelled'"
          class="p-4 bg-red-50 text-red-700 border border-red-200 rounded-card text-xs flex items-center gap-3"
        >
          <i class="pi pi-times-circle text-lg shrink-0 text-red-600" />
          <div>
            <p class="font-semibold m-0">Pesanan Dibatalkan</p>
            <p class="text-[11px] text-red-600/90 m-0 mt-0.5">
              Pesanan ini telah dibatalkan atau waktu pembayaran telah kedaluwarsa.
            </p>
          </div>
        </div>

        <!-- Active Stepper -->
        <div v-else class="relative pt-2 pb-1">
          <!-- Background Connecting Track -->
          <div
            class="absolute top-6 left-12 right-12 h-1 bg-brand-hairsoft -translate-y-1/2 z-0 rounded-full hidden sm:block"
          />

          <!-- Filled Connecting Progress Line -->
          <div
            class="absolute top-6 left-12 h-1 bg-emerald-600 transition-all duration-500 ease-out -translate-y-1/2 z-0 rounded-full hidden sm:block"
            :style="{ width: `calc(${progressLineWidth} - 24px)` }"
          />

          <!-- Stepper Nodes Grid -->
          <div class="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-2">
            <div
              v-for="(step, idx) in orderSteps"
              :key="step.title"
              class="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2.5"
            >
              <!-- Node Circle -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300"
                :class="[
                  step.isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                    : step.isActive && order.status === 'pending'
                      ? 'bg-amber-500 text-white shadow-sm ring-4 ring-amber-100 animate-pulse'
                      : step.isActive
                        ? 'bg-brand-accent text-white shadow-sm ring-4 ring-brand-accent/20'
                        : 'bg-white border-2 border-brand-hair text-brand-muted',
                ]"
              >
                <i v-if="step.isCompleted" class="pi pi-check text-xs" />
                <i
                  v-else-if="step.isActive && order.status === 'pending'"
                  class="pi pi-clock text-xs"
                />
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <!-- Step Info -->
              <div class="min-w-0">
                <p
                  class="font-display font-bold text-xs m-0 truncate"
                  :class="[
                    step.isCompleted || step.isActive ? 'text-brand-ink' : 'text-brand-muted',
                  ]"
                >
                  {{ step.title }}
                </p>
                <p
                  class="text-[11px] m-0 mt-0.5 leading-snug"
                  :class="[
                    step.isActive && order.status === 'pending'
                      ? 'text-amber-700 font-medium'
                      : 'text-brand-muted',
                  ]"
                >
                  {{ step.description }}
                </p>
                <p v-if="step.timestamp" class="text-[10px] text-brand-faint m-0 mt-0.5 truncate">
                  {{ step.timestamp }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Items List & Delivery Address -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Items Card -->
          <div class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper space-y-4">
            <h2
              class="font-display text-base font-bold text-brand-ink m-0 pb-3 border-b border-brand-hairsoft"
            >
              Daftar Barang Belanja
            </h2>

            <div class="divide-y divide-brand-hairsoft">
              <article
                v-for="item in order.items"
                :key="item.id"
                class="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div class="flex items-center gap-4 min-w-0">
                  <div
                    class="w-16 h-16 rounded-card bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
                  >
                    <img
                      v-if="item.product?.image_url"
                      :src="item.product.image_url"
                      :alt="item.product?.name || 'Produk'"
                      class="w-full h-full object-cover"
                    />
                    <i v-else class="pi pi-image text-brand-faint text-xl" />
                  </div>

                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/product/${item.product_id}`"
                      class="font-display font-semibold text-xs sm:text-sm text-brand-ink hover:text-brand-accent transition-colors no-underline line-clamp-1"
                    >
                      {{ item.product?.name || `Produk #${item.product_id}` }}
                    </NuxtLink>
                    <p class="font-body text-xs text-brand-muted m-0 mt-0.5">
                      {{ item.qty }}x @ {{ formatRupiah(item.price_cents / 100) }}
                    </p>
                  </div>
                </div>

                <span
                  class="font-display font-bold text-xs sm:text-sm text-brand-ink tabular-nums shrink-0"
                >
                  {{ formatRupiah((item.price_cents * item.qty) / 100) }}
                </span>
              </article>
            </div>
          </div>

          <!-- Address Card -->
          <div class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper space-y-3">
            <div class="flex items-center gap-2 pb-3 border-b border-brand-hairsoft">
              <i class="pi pi-map-marker text-brand-accent text-base" />
              <h2 class="font-display text-base font-bold text-brand-ink m-0">Tujuan Pengiriman</h2>
            </div>

            <div class="text-xs text-brand-muted space-y-1">
              <p class="font-bold text-brand-ink m-0">
                {{ (order.address as any)?.name }} ({{ (order.address as any)?.phone }})
              </p>
              <p class="m-0 leading-relaxed">
                {{ (order.address as any)?.street }}, {{ (order.address as any)?.city }}
                {{ (order.address as any)?.postal }}
              </p>
              <p
                v-if="(order.address as any)?.note"
                class="italic text-[11px] text-brand-muted pt-1 m-0"
              >
                Catatan: "{{ (order.address as any)?.note }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column: Payment & Bill Summary -->
        <aside
          class="lg:col-span-4 bg-white border border-brand-hair rounded-card p-6 shadow-whisper space-y-5 sticky top-24"
        >
          <h2
            class="font-display text-base font-bold text-brand-ink m-0 pb-3 border-b border-brand-hairsoft"
          >
            Ringkasan Pembayaran
          </h2>

          <div class="space-y-3 text-xs text-brand-muted">
            <div class="flex items-center justify-between">
              <span>Status Pembayaran</span>
              <UiBadge
                :variant="getStatusBadge(order.status).variant"
                :label="getStatusBadge(order.status).label"
              />
            </div>
            <div v-if="order.payment_type" class="flex items-center justify-between">
              <span>Metode Pembayaran</span>
              <span class="font-semibold text-brand-ink uppercase">{{ order.payment_type }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Biaya Pengiriman</span>
              <span class="text-brand-accent font-semibold">Gratis Ongkir</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Pajak PPN (11%)</span>
              <span class="font-semibold text-brand-ink">Termasuk</span>
            </div>
          </div>

          <div class="pt-4 border-t border-brand-hairsoft flex items-center justify-between">
            <span class="font-display font-bold text-sm text-brand-ink">Total Tagihan</span>
            <span class="font-display text-xl font-bold text-brand-ink tabular-nums">
              {{ formatRupiah(order.total_cents / 100) }}
            </span>
          </div>

          <!-- Action Button if pending -->
          <div v-if="order.status === 'pending'" class="space-y-3 pt-2">
            <UiButton
              variant="primary"
              size="md"
              class="w-full justify-center"
              icon="pi-credit-card"
              :loading="isPaying"
              :disabled="isCancelling || isManualChecking"
              @click="handlePayNow"
            >
              Bayar Sekarang (Midtrans)
            </UiButton>
            <UiButton
              variant="outline"
              size="md"
              class="w-full justify-center !text-brand-ink hover:!bg-brand-hairsoft font-semibold"
              icon="pi-sync"
              :loading="isManualChecking"
              :disabled="isPaying || isCancelling"
              @click="handleCheckPaymentStatus(false)"
            >
              Cek Status Pembayaran
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              class="w-full justify-center !text-red-600 hover:!text-red-700 hover:!border-red-300"
              icon="pi-times-circle"
              :disabled="isPaying || isCancelling || isManualChecking"
              @click="isCancelModalOpen = true"
            >
              Batalkan Pesanan
            </UiButton>
            <p class="text-[11px] text-brand-muted text-center m-0">
              Pembayaran diproses secara instan dan aman melalui jaringan Midtrans.
            </p>
          </div>

          <UiButton
            variant="outline"
            size="sm"
            class="w-full justify-center text-xs"
            icon="pi-print"
            @click="isInvoiceModalOpen = true"
          >
            Cetak Invoice Resmi
          </UiButton>

          <UiButton
            to="/orders"
            variant="secondary"
            size="sm"
            class="w-full justify-center text-xs"
            icon="pi-arrow-left"
          >
            Kembali ke Daftar Pesanan
          </UiButton>
        </aside>
      </div>
    </div>

    <!-- Modal Konfirmasi Pembatalan -->
    <OrderCancelDialog
      v-model:visible="isCancelModalOpen"
      :loading="isCancelling"
      @confirm="handleCancelOrder"
    />

    <!-- Modal Invoice Resmi & Print Sheet -->
    <OrderInvoiceModal v-if="order" v-model:visible="isInvoiceModalOpen" :order="order" />
  </div>
</template>
