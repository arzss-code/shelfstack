<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import { useCartStore } from '~/features/cart/stores/cart'
import { checkoutAddressSchema } from '~~/shared/schemas/order'
import { formatRupiah } from '~/utils/format'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import { useAddresses } from '~/composables/useAddresses'
import type { UserAddress } from '~~/shared/schemas/address'
import SavedAddressSelector from '~/components/checkout/SavedAddressSelector.vue'

const { user, profile } = useAuth()
const cartStore = useCartStore()
const router = useRouter()
const toast = useUiToast()
const config = useRuntimeConfig()
const { pay: openSnapModal } = useMidtransSnap()

useSeoMeta({
  title: 'Checkout & Pembayaran - ShelfStack',
  description:
    'Selesaikan pemesanan produk pilihan Anda dengan aman melalui gateway resmi Midtrans.',
})

const address = ref({
  name: profile.value?.full_name || '',
  phone: '',
  street: '',
  city: '',
  postal: '',
  note: '',
})

// Isi nama otomatis jika profil dimuat setelah mount
watch(
  () => profile.value?.full_name,
  (name) => {
    if (name && !address.value.name) {
      address.value.name = name
    }
  },
)

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isOrderPlaced = ref(false)
const createdOrderId = ref<string | null>(null)
const generalError = ref('')
const checkoutIdempotencyKey = ref<string>('')

// Snapshot isi keranjang agar UI ringkasan dan preview item tetap utuh saat popup Midtrans dibuka
const placedOrderSnapshot = ref<{
  items: typeof cartStore.items
  totalItems: number
  totalPriceFormatted: string
  discountFormatted?: string | null
  couponCode?: string | null
  finalPriceFormatted?: string
} | null>(null)

const displayItems = computed(() => placedOrderSnapshot.value?.items ?? cartStore.items)
const displayTotalItems = computed(
  () => placedOrderSnapshot.value?.totalItems ?? cartStore.totalItems,
)
const displayTotalPrice = computed(
  () => placedOrderSnapshot.value?.totalPriceFormatted ?? cartStore.formattedTotalPrice,
)
const displayDiscountAmount = computed(() => {
  if (placedOrderSnapshot.value) {
    return placedOrderSnapshot.value.discountFormatted
  }
  return cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null
})
const displayCouponCode = computed(() => {
  if (placedOrderSnapshot.value) {
    return placedOrderSnapshot.value.couponCode
  }
  return cartStore.appliedCoupon?.code || null
})
const displayFinalPrice = computed(() => {
  if (placedOrderSnapshot.value) {
    return (placedOrderSnapshot.value as any).finalPriceFormatted
  }
  return cartStore.formattedFinalPrice
})

const submitButtonLabel = computed(() => {
  if (isOrderPlaced.value) {
    return 'Membuka Pembayaran...'
  }
  if (isSubmitting.value) {
    return 'Memproses Pesanan...'
  }
  return 'Bayar Sekarang'
})

const { saveAddress } = useAddresses()
const selectedSavedAddressId = ref<string | null>(null)
const saveAddressForNextOrder = ref(false)

const handleSelectSavedAddress = (saved: UserAddress) => {
  selectedSavedAddressId.value = saved.id
  address.value.name = saved.name
  address.value.phone = saved.phone
  address.value.street = saved.street
  address.value.city = saved.city
  address.value.postal = saved.postal
  address.value.note = saved.note || ''
  errors.value = {}
}

const getOrCreateCheckoutKey = () => {
  if (!checkoutIdempotencyKey.value) {
    checkoutIdempotencyKey.value =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `chk-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return checkoutIdempotencyKey.value
}

// Reset Idempotency-Key jika user memodifikasi isi keranjang atau rincian alamat
// sehingga checkout baru yang disengaja memiliki kunci baru dan terhindar dari conflict 409
watch(
  [() => cartStore.items, address],
  () => {
    checkoutIdempotencyKey.value = ''
  },
  { deep: true },
)

const validateForm = () => {
  errors.value = {}
  const result = checkoutAddressSchema.safeParse(address.value)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0 && messages[0]) {
        errors.value[key] = messages[0]
      }
    }
    return false
  }
  return true
}

const handleCreateOrder = async () => {
  if (isSubmitting.value || isOrderPlaced.value) {
    return
  }

  if (!user.value) {
    router.push('/auth/login?redirect=/checkout')
    return
  }

  if (cartStore.isEmpty) {
    generalError.value = 'Keranjang belanja Anda kosong. Silakan pilih produk terlebih dahulu.'
    return
  }

  if (!validateForm()) {
    generalError.value = 'Mohon periksa kembali kelengkapan formulir alamat pengiriman.'
    return
  }

  isSubmitting.value = true
  generalError.value = ''

  try {
    // 1. Submit pesanan ke server API (Memanggil create_order RPC di Supabase)
    const orderPayload = {
      items: cartStore.items.map((item) => ({
        product_id: item.productId,
        qty: item.quantity,
      })),
      address: {
        name: address.value.name.trim(),
        phone: address.value.phone.trim(),
        street: address.value.street.trim(),
        city: address.value.city.trim(),
        postal: address.value.postal.trim(),
        note: address.value.note ? address.value.note.trim() : undefined,
      },
      coupon_code:
        cartStore.appliedCoupon && cartStore.isCouponValidForCurrentSubtotal
          ? cartStore.appliedCoupon.code
          : undefined,
    }

    // Gunakan Idempotency-Key persisten per logical attempt untuk mencegah order ganda
    const idempotencyKey = getOrCreateCheckoutKey()

    const response = await $fetch<{ status: string; data: { order_id: string } }>('/api/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: orderPayload,
    })

    const orderId = response.data.order_id
    createdOrderId.value = orderId

    // Simpan snapshot keranjang agar rincian pesanan tetap tampil stabil saat popup pembayaran disiapkan
    placedOrderSnapshot.value = {
      items: [...cartStore.items],
      totalItems: cartStore.totalItems,
      totalPriceFormatted: cartStore.formattedTotalPrice,
      discountFormatted: cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null,
      couponCode: cartStore.appliedCoupon?.code || null,
      finalPriceFormatted: cartStore.formattedFinalPrice,
    }
    isOrderPlaced.value = true

    // Reset key setelah logical checkout berhasil dibuat
    checkoutIdempotencyKey.value = ''

    // Kosongkan keranjang belanja
    cartStore.clearCart()

    // Simpan alamat jika opsi "Simpan alamat ini untuk pesanan berikutnya" dicentang
    if (saveAddressForNextOrder.value && user.value) {
      try {
        await saveAddress({
          name: address.value.name.trim(),
          phone: address.value.phone.trim(),
          street: address.value.street.trim(),
          city: address.value.city.trim(),
          postal: address.value.postal.trim(),
          note: address.value.note ? address.value.note.trim() : undefined,
        })
      } catch (saveErr) {
        console.warn('[Checkout] Gagal menyimpan alamat ke daftar tersimpan:', saveErr)
      }
    }

    // 2. Jika Midtrans Sandbox aktif, minta token Snap dan buka modal pembayaran
    if (config.public.enableMidtransSandbox) {
      try {
        const tokenRes = await $fetch<{
          status: string
          data: { token: string; redirect_url?: string }
        }>(`/api/orders/${orderId}/payment-token`, {
          method: 'POST',
        })

        const snapToken = tokenRes.data.token

        openSnapModal(snapToken, {
          onSuccess: () => {
            toast.add({
              severity: 'success',
              summary: 'Pembayaran Diterima',
              detail: 'Pembayaran berhasil diproses di Sandbox.',
              life: 4000,
            })
            router.push(`/orders/${orderId}`)
          },
          onPending: () => {
            toast.add({
              severity: 'info',
              summary: 'Menunggu Pembayaran',
              detail: 'Instruksi pembayaran telah dibuat.',
              life: 4000,
            })
            router.push(`/orders/${orderId}`)
          },
          onError: () => {
            toast.add({
              severity: 'error',
              summary: 'Pembayaran Gagal',
              detail: 'Transaksi dibatalkan atau terjadi kesalahan.',
              life: 5000,
            })
            router.push(`/orders/${orderId}`)
          },
          onClose: () => {
            router.push(`/orders/${orderId}`)
          },
        })
        return
      } catch (tokenErr: unknown) {
        console.warn('Gagal memuat token Snap Midtrans, mengalihkan ke detail pesanan:', tokenErr)
        router.push(`/orders/${orderId}`)
        return
      }
    }

    // Jika sandbox mati / fallback, langsung arahkan ke halaman detail pesanan
    toast.add({
      severity: 'success',
      summary: 'Pesanan Dibuat',
      detail: 'Pesanan berhasil dibuat dengan status pending.',
      life: 4000,
    })
    router.push(`/orders/${orderId}`)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    generalError.value =
      fetchErr.data?.message || 'Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.'
    isOrderPlaced.value = false
    placedOrderSnapshot.value = null
  } finally {
    isSubmitting.value = false
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
        to="/cart"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
      >
        Keranjang
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Checkout</span>
    </nav>

    <!-- Header -->
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">
        Checkout &amp; Pengiriman
      </h1>
      <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
        Lengkapi informasi alamat pengiriman untuk memproses transaksi resmi kurasi Anda.
      </p>
    </div>

    <!-- Auth Guard Check -->
    <div
      v-if="!user"
      class="bg-amber-50 border border-amber-200 rounded-card p-6 text-center max-w-md mx-auto space-y-4"
    >
      <div
        class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700"
      >
        <i class="pi pi-lock text-xl" />
      </div>
      <div>
        <h2 class="font-display font-bold text-base text-amber-900 m-0">Login Diperlukan</h2>
        <p class="font-body text-xs text-amber-800 m-0 mt-1">
          Untuk menjaga keamanan transaksi dan melacak pesanan, silakan login ke akun Anda terlebih
          dahulu.
        </p>
      </div>
      <UiButton
        to="/auth/login?redirect=/checkout"
        variant="primary"
        size="sm"
        class="w-full justify-center"
      >
        Masuk ke Akun
      </UiButton>
    </div>

    <!-- Empty Cart Check -->
    <div
      v-else-if="cartStore.isEmpty && !isOrderPlaced && !isSubmitting"
      class="text-center py-16 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-md mx-auto space-y-4"
    >
      <i class="pi pi-shopping-bag text-3xl text-brand-muted" />
      <h2 class="font-display text-lg font-bold text-brand-ink m-0">Keranjang Belanja Kosong</h2>
      <p class="text-xs text-brand-muted m-0">
        Anda tidak memiliki produk di dalam keranjang untuk di-checkout.
      </p>
      <UiButton to="/katalog" variant="primary" size="sm"> Kembali ke Katalog </UiButton>
    </div>

    <!-- Checkout Main Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Column: Shipping Form & Payment Method Info -->
      <section class="lg:col-span-7 space-y-6" aria-labelledby="shipping-heading">
        <!-- Error Alert -->
        <div
          v-if="generalError"
          class="p-4 bg-brand-danger-tint border border-brand-danger-edge rounded-card flex items-start gap-3 text-brand-danger-text text-xs"
        >
          <i class="pi pi-exclamation-circle text-base shrink-0 mt-0.5" />
          <span>{{ generalError }}</span>
        </div>

        <!-- Payment Preparation Banner -->
        <div
          v-if="isOrderPlaced && createdOrderId"
          class="p-4 bg-brand-success-tint border border-brand-success-edge rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-brand-success-text text-xs"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-spin pi-spinner text-base shrink-0 text-brand-success" />
            <span>Pesanan berhasil dibuat. Menyiapkan popup pembayaran resmi Midtrans...</span>
          </div>
          <NuxtLink
            :to="`/orders/${createdOrderId}`"
            class="font-semibold text-brand-success-text hover:text-brand-ink underline shrink-0"
          >
            Buka Pesanan &rarr;
          </NuxtLink>
        </div>

        <!-- Address Card Form Controls -->
        <fieldset
          :disabled="isSubmitting || isOrderPlaced"
          class="border-0 p-0 m-0 min-w-0 space-y-6"
        >
          <div
            class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-4"
          >
            <div class="flex items-center gap-2 pb-3 border-b border-brand-hairsoft">
              <i class="pi pi-map-marker text-brand-accent text-base" />
              <h2 id="shipping-heading" class="font-display text-base font-bold text-brand-ink m-0">
                Alamat Pengiriman
              </h2>
            </div>

            <!-- Saved Address Selector if User is Logged In -->
            <div v-if="user" class="pb-4 border-b border-brand-hairsoft">
              <SavedAddressSelector
                :selected-id="selectedSavedAddressId"
                @select="handleSelectSavedAddress"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nama Penerima -->
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Nama Penerima <span class="text-red-500">*</span>
                </label>
                <UiInput
                  v-model="address.name"
                  placeholder="cth. Arya Santoso"
                  :error="errors.name"
                />
              </div>

              <!-- Nomor Telepon -->
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
                </label>
                <UiInput
                  v-model="address.phone"
                  placeholder="cth. 081234567890"
                  :error="errors.phone"
                />
              </div>
            </div>

            <!-- Alamat Lengkap -->
            <div class="space-y-1">
              <label class="block text-xs font-semibold text-brand-ink">
                Alamat Lengkap (Jalan, No. Rumah, RT/RW, Kelurahan)
                <span class="text-red-500">*</span>
              </label>
              <UiInput
                v-model="address.street"
                placeholder="cth. Jl. Sudirman No. 42, RT 01/RW 04, Menteng"
                :error="errors.street"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Kota / Kabupaten -->
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Kota / Kabupaten <span class="text-red-500">*</span>
                </label>
                <UiInput
                  v-model="address.city"
                  placeholder="cth. Jakarta Pusat"
                  :error="errors.city"
                />
              </div>

              <!-- Kode Pos -->
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Kode Pos <span class="text-red-500">*</span>
                </label>
                <UiInput v-model="address.postal" placeholder="cth. 10220" :error="errors.postal" />
              </div>
            </div>

            <!-- Catatan Pengiriman -->
            <div class="space-y-1">
              <label class="block text-xs font-semibold text-brand-ink">
                Catatan untuk Kurir (Opsional)
              </label>
              <UiInput
                v-model="address.note"
                placeholder="cth. Titipkan ke satpam jika penerima tidak ada di tempat"
                :error="errors.note"
              />
            </div>

            <!-- Option Checkbox: Simpan alamat ini untuk pesanan berikutnya -->
            <div v-if="user" class="flex items-center gap-2 pt-3 border-t border-brand-hairsoft">
              <input
                id="save_address_checkbox"
                v-model="saveAddressForNextOrder"
                type="checkbox"
                class="rounded border-brand-hair text-brand-accent focus:ring-brand-accent w-4 h-4 cursor-pointer"
              />
              <label
                for="save_address_checkbox"
                class="text-xs text-brand-ink font-medium cursor-pointer select-none"
              >
                Simpan alamat ini untuk pesanan berikutnya
              </label>
            </div>
          </div>
        </fieldset>

        <!-- Payment Method Notice -->
        <div
          class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-3"
        >
          <div class="flex items-center gap-2 pb-3 border-b border-brand-hairsoft">
            <i class="pi pi-credit-card text-brand-accent text-base" />
            <h2 class="font-display text-base font-bold text-brand-ink m-0">Metode Pembayaran</h2>
          </div>

          <div
            class="flex items-start gap-3 p-3.5 bg-brand-canvas-soft rounded-card border border-brand-hairsoft"
          >
            <i class="pi pi-check-circle text-brand-accent text-lg mt-0.5" />
            <div>
              <p class="font-display font-bold text-xs text-brand-ink m-0">
                {{
                  config.public.enableMidtransSandbox
                    ? 'Simulasi Pembayaran Midtrans Snap (Sandbox)'
                    : 'Midtrans Snap Payment Gateway'
                }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5 leading-relaxed">
                <template v-if="config.public.enableMidtransSandbox">
                  Mode simulasi sandbox aktif untuk pengujian. Mendukung simulasi QRIS, GoPay, dan
                  Virtual Account tanpa memotong saldo nyata.
                </template>
                <template v-else>
                  Mendukung transaksi aman QRIS, GoPay, ShopeePay, serta Virtual Account Bank
                  Mandiri, BCA, BNI, dan BRI.
                </template>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column: Order Summary & Pay Action -->
      <aside
        class="lg:col-span-5 bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-5 sticky top-28"
      >
        <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
          <h2 class="font-display text-base font-bold text-brand-ink m-0">Item Pesanan</h2>
          <span
            class="text-xs font-semibold text-brand-ink bg-brand-canvas-soft border border-brand-hair px-2.5 py-0.5 rounded-full"
          >
            {{ displayTotalItems }} item
          </span>
        </div>

        <!-- Items Preview Scrollable -->
        <div class="max-h-64 overflow-y-auto divide-y divide-brand-hairsoft pr-1">
          <div
            v-for="item in displayItems"
            :key="`${item.productId}-${item.color}-${item.material}`"
            class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-12 h-12 rounded-field bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-brand-faint text-sm" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-brand-ink m-0 truncate">
                  {{ item.name }}
                </p>
                <p class="text-[10.5px] text-brand-muted m-0">
                  {{ item.quantity }}x @ {{ formatRupiah(item.price) }}
                </p>
              </div>
            </div>
            <span class="font-bold text-brand-ink tabular-nums shrink-0">
              {{ formatRupiah(item.price * item.quantity) }}
            </span>
          </div>
        </div>

        <!-- Bill Details -->
        <div class="pt-4 border-t border-brand-hairsoft space-y-2.5 text-xs text-brand-muted">
          <div v-if="!isOrderPlaced" class="pb-2 border-b border-brand-hairsoft">
            <CartCouponInput compact />
          </div>

          <div class="flex items-center justify-between">
            <span>Subtotal Produk</span>
            <span class="font-semibold text-brand-ink tabular-nums">
              {{ displayTotalPrice }}
            </span>
          </div>
          <div
            v-if="displayDiscountAmount"
            class="flex items-center justify-between text-brand-success-text font-medium"
          >
            <span
              >Diskon Kupon Promo {{ displayCouponCode ? '(' + displayCouponCode + ')' : '' }}</span
            >
            <span class="font-bold tabular-nums"> -{{ displayDiscountAmount }} </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Biaya Pengiriman</span>
            <span class="text-brand-success font-semibold">Gratis Ongkir</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Pajak PPN (11%)</span>
            <span class="font-semibold text-brand-ink">Termasuk</span>
          </div>
          <div class="pt-3 border-t border-brand-hairsoft flex items-center justify-between">
            <span class="font-display font-bold text-sm text-brand-ink">Total Tagihan</span>
            <span class="font-display text-xl font-bold text-brand-ink tabular-nums">
              {{ displayFinalPrice }}
            </span>
          </div>
        </div>

        <!-- Submit Button -->
        <UiButton
          variant="primary"
          size="md"
          class="w-full justify-center text-xs font-semibold py-3 rounded-full shadow-whisper"
          icon="pi-lock"
          :loading="isSubmitting || isOrderPlaced"
          :disabled="isSubmitting || isOrderPlaced"
          @click="handleCreateOrder"
        >
          {{ submitButtonLabel }}
        </UiButton>

        <p class="text-[10.5px] text-center text-brand-muted m-0">
          Transaksi aman terlindungi enkripsi Midtrans Payment Gateway.
        </p>
      </aside>
    </div>
  </div>
</template>
