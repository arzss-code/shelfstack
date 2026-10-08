<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import { useToast } from 'primevue/usetoast'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import OrderCancelDialog from '~/features/orders/components/OrderCancelDialog.vue'
import type { RealtimeChannel } from '@supabase/supabase-js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const config = useRuntimeConfig()
const { pay: openSnapModal } = useMidtransSnap()

const orderId = route.params.id as string
const order = ref<Order | null>(null)
const loading = ref(true)
const isPaying = ref(false)
const isCancelling = ref(false)
const isCancelModalOpen = ref(false)
const errorMsg = ref('')

let channel: RealtimeChannel | null = null

useSeoMeta({
  title: () =>
    order.value
      ? `Pesanan #${order.value.id.slice(0, 8)} — ShelfStack`
      : 'Detail Pesanan — ShelfStack',
  description: 'Detail informasi dan status pemesanan produk resmi di ShelfStack.',
})

const fetchOrderDetail = async () => {
  if (!user.value) {
    router.push(`/auth/login?redirect=/orders/${orderId}`)
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId}`)
    order.value = res.data
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMsg.value = fetchErr.data?.message || 'Pesanan tidak ditemukan atau akses ditolak.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchOrderDetail()

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
            order.value = {
              ...order.value,
              status: updated.status as OrderStatus,
              payment_type: (updated.payment_type as string) || order.value.payment_type,
              paid_at: (updated.paid_at as string) || order.value.paid_at,
            }

            toast.add({
              severity: 'success',
              summary: 'Status Berubah Realtime',
              detail: `Status pesanan otomatis diperbarui menjadi: ${order.value.status}.`,
              life: 5000,
            })
          }
        },
      )
      .subscribe()
  }
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

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
          detail: 'Pembayaran berhasil diproses di Sandbox.',
          life: 4000,
        })
        fetchOrderDetail()
      },
      onPending: () => {
        toast.add({
          severity: 'info',
          summary: 'Menunggu Pembayaran',
          detail: 'Instruksi pembayaran telah aktif.',
          life: 4000,
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
    })
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      severity: 'error',
      summary: 'Gagal Membuka Pembayaran',
      detail: fetchErr.data?.message || 'Tidak dapat memuat token pembayaran Midtrans.',
      life: 4000,
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

        <!-- Realtime Pulse Pill -->
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-[11px] self-start sm:self-center font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Realtime Status Aktif</span>
        </div>
      </div>

      <!-- Timeline Status Progress -->
      <div class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper">
        <h2 class="font-display text-sm font-bold text-brand-ink m-0 mb-4">
          Status Alur Transaksi
        </h2>

        <div
          v-if="order.status === 'cancelled'"
          class="p-4 bg-red-50 text-red-700 rounded-card text-xs flex items-center gap-2"
        >
          <i class="pi pi-times-circle text-base" />
          <span>Pesanan ini telah dibatalkan atau waktu pembayaran telah kedaluwarsa.</span>
        </div>

        <div v-else class="grid grid-cols-4 gap-2 text-center text-xs">
          <!-- Step 1: Dipesan -->
          <div class="space-y-2">
            <div
              class="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs bg-emerald-600 text-white"
            >
              <i class="pi pi-check text-xs" />
            </div>
            <p class="font-semibold text-brand-ink m-0 text-[11px]">Dipesan</p>
          </div>

          <!-- Step 2: Dibayar -->
          <div class="space-y-2">
            <div
              class="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors"
              :class="
                order.status !== 'pending'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-field text-brand-muted border border-brand-hair'
              "
            >
              <i v-if="order.status !== 'pending'" class="pi pi-check text-xs" />
              <span v-else>2</span>
            </div>
            <p
              class="font-semibold m-0 text-[11px]"
              :class="order.status !== 'pending' ? 'text-brand-ink' : 'text-brand-muted'"
            >
              Dibayar
            </p>
          </div>

          <!-- Step 3: Dikirim -->
          <div class="space-y-2">
            <div
              class="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors"
              :class="
                ['shipped', 'completed'].includes(order.status)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-field text-brand-muted border border-brand-hair'
              "
            >
              <i
                v-if="['shipped', 'completed'].includes(order.status)"
                class="pi pi-check text-xs"
              />
              <span v-else>3</span>
            </div>
            <p
              class="font-semibold m-0 text-[11px]"
              :class="
                ['shipped', 'completed'].includes(order.status)
                  ? 'text-brand-ink'
                  : 'text-brand-muted'
              "
            >
              Dikirim
            </p>
          </div>

          <!-- Step 4: Selesai -->
          <div class="space-y-2">
            <div
              class="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors"
              :class="
                order.status === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-field text-brand-muted border border-brand-hair'
              "
            >
              <i v-if="order.status === 'completed'" class="pi pi-check text-xs" />
              <span v-else>4</span>
            </div>
            <p
              class="font-semibold m-0 text-[11px]"
              :class="order.status === 'completed' ? 'text-brand-ink' : 'text-brand-muted'"
            >
              Selesai
            </p>
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
              :disabled="isCancelling"
              @click="handlePayNow"
            >
              Bayar Sekarang (Midtrans)
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              class="w-full justify-center !text-red-600 hover:!text-red-700 hover:!border-red-300"
              icon="pi-times-circle"
              :disabled="isPaying || isCancelling"
              @click="isCancelModalOpen = true"
            >
              Batalkan Pesanan
            </UiButton>
            <p class="text-[11px] text-brand-muted text-center m-0">
              Gunakan simulator Midtrans Sandbox untuk menguji pembayaran.
            </p>
          </div>

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
  </div>
</template>
