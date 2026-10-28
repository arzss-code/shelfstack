<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface AdminCoupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents: number | null
  formatted_max_discount: string
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit: number | null
  usage_count: number
  user_limit: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  is_expired: boolean
  created_at: string
}

interface CouponMetrics {
  total_coupons: number
  active_coupons: number
  total_usages: number
  total_discount_cents: number
  formatted_total_discount: string
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Voucher - ShelfStack Admin',
})

const coupons = ref<AdminCoupon[]>([])
const metrics = ref<CouponMetrics>({
  total_coupons: 0,
  active_coupons: 0,
  total_usages: 0,
  total_discount_cents: 0,
  formatted_total_discount: 'Rp0',
})

const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive' | 'expired'>('all')
const typeFilter = ref<'all' | 'percentage' | 'fixed'>('all')

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const submitting = ref(false)
const modalError = ref<string | null>(null)
const feedbackMessage = ref<string | null>(null)

// Delete Dialog State
const isDeleteModalOpen = ref(false)
const deletingCoupon = ref<AdminCoupon | null>(null)
const deleting = ref(false)

// Form State
const form = ref({
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  max_discount_rupiah: null as number | null,
  min_purchase_rupiah: 0,
  usage_limit: null as number | null,
  user_limit: 1,
  starts_at: '',
  expires_at: '',
  is_active: true,
})

const fetchCoupons = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (typeFilter.value !== 'all') params.discount_type = typeFilter.value

    const res = await $fetch<{
      status: string
      data: { coupons: AdminCoupon[]; metrics: CouponMetrics }
    }>('/api/admin/coupons', {
      query: params,
    })

    if (res?.data) {
      coupons.value = res.data.coupons
      metrics.value = res.data.metrics
    }
  } catch (err: any) {
    feedbackMessage.value =
      err?.data?.message || 'Gagal memuat daftar voucher. Silakan refresh halaman.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCoupons()
})

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  modalError.value = null
  form.value = {
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_rupiah: null,
    min_purchase_rupiah: 0,
    usage_limit: 100,
    user_limit: 1,
    starts_at: '',
    expires_at: '',
    is_active: true,
  }
  isModalOpen.value = true
}

const openEditModal = (coupon: AdminCoupon) => {
  isEditing.value = true
  editingId.value = coupon.id
  modalError.value = null

  // Convert cents to rupiah for user inputs
  const discountVal =
    coupon.discount_type === 'percentage' ? coupon.discount_value : coupon.discount_value / 100

  form.value = {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description || '',
    discount_type: coupon.discount_type,
    discount_value: discountVal,
    max_discount_rupiah: coupon.max_discount_cents ? coupon.max_discount_cents / 100 : null,
    min_purchase_rupiah: coupon.min_purchase_cents ? coupon.min_purchase_cents / 100 : 0,
    usage_limit: coupon.usage_limit,
    user_limit: coupon.user_limit,
    starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
    expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
    is_active: coupon.is_active,
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  modalError.value = null
}

const handleSubmit = async () => {
  submitting.value = true
  modalError.value = null

  try {
    const rawDiscountValue =
      form.value.discount_type === 'percentage'
        ? Math.floor(form.value.discount_value)
        : Math.floor(form.value.discount_value * 100)

    const payload: any = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      discount_type: form.value.discount_type,
      discount_value: rawDiscountValue,
      max_discount_cents: form.value.max_discount_rupiah
        ? Math.floor(form.value.max_discount_rupiah * 100)
        : null,
      min_purchase_cents: form.value.min_purchase_rupiah
        ? Math.floor(form.value.min_purchase_rupiah * 100)
        : 0,
      usage_limit: form.value.usage_limit ? Number(form.value.usage_limit) : null,
      user_limit: Number(form.value.user_limit) || 1,
      starts_at: form.value.starts_at ? new Date(form.value.starts_at).toISOString() : null,
      expires_at: form.value.expires_at ? new Date(form.value.expires_at).toISOString() : null,
      is_active: form.value.is_active,
    }

    if (!isEditing.value) {
      payload.code = form.value.code.trim().toUpperCase()
      await $fetch('/api/admin/coupons', {
        method: 'POST',
        body: payload,
      })
      feedbackMessage.value = `Voucher "${payload.code}" berhasil dibuat.`
    } else if (editingId.value) {
      await $fetch(`/api/admin/coupons/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      })
      feedbackMessage.value = `Voucher "${form.value.code}" berhasil diperbarui.`
    }

    closeModal()
    await fetchCoupons()

    setTimeout(() => {
      feedbackMessage.value = null
    }, 4000)
  } catch (err: any) {
    modalError.value =
      err?.data?.message || err?.message || 'Gagal menyimpan voucher. Periksa input data Anda.'
  } finally {
    submitting.value = false
  }
}

const toggleCouponStatus = async (coupon: AdminCoupon) => {
  const newStatus = !coupon.is_active
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PUT',
      body: { is_active: newStatus },
    })
    coupon.is_active = newStatus
    feedbackMessage.value = `Status voucher "${coupon.code}" diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`
    setTimeout(() => {
      feedbackMessage.value = null
    }, 3000)
  } catch (err: any) {
    feedbackMessage.value = err?.data?.message || 'Gagal memperbarui status voucher.'
  }
}

const confirmDelete = (coupon: AdminCoupon) => {
  deletingCoupon.value = coupon
  isDeleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!deletingCoupon.value) return
  deleting.value = true

  try {
    await $fetch(`/api/admin/coupons/${deletingCoupon.value.id}`, {
      method: 'DELETE',
    })
    feedbackMessage.value = `Voucher "${deletingCoupon.value.code}" berhasil dihapus.`
    isDeleteModalOpen.value = false
    deletingCoupon.value = null
    await fetchCoupons()

    setTimeout(() => {
      feedbackMessage.value = null
    }, 4000)
  } catch (err: any) {
    feedbackMessage.value = err?.data?.message || 'Gagal menghapus voucher.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="admin-coupons-page space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-hair"
    >
      <div>
        <div class="flex items-center gap-2 text-xs text-brand-muted mb-1">
          <NuxtLink to="/admin" class="hover:text-brand-ink no-underline">Dashboard</NuxtLink>
          <span>/</span>
          <span class="text-brand-ink font-semibold">Kelola Voucher</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink">
          Kelola Voucher Promo
        </h1>
        <p class="text-xs sm:text-sm text-brand-muted mt-0.5">
          Atur kode promo, batas pagu diskon, dan pantau pemakaian kuota secara terpusat.
        </p>
      </div>

      <button
        type="button"
        class="px-5 py-2.5 rounded-full bg-brand-ink text-white hover:bg-brand-inkhover transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-whisper active:scale-95"
        @click="openCreateModal"
      >
        <i class="pi pi-plus text-xs" />
        <span>Buat Voucher Baru</span>
      </button>
    </div>

    <!-- FEEDBACK TOAST / BANNER -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="feedbackMessage"
        class="p-3.5 rounded-xl bg-brand-ink text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-whisper"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{{ feedbackMessage }}</span>
        </div>
        <button
          type="button"
          class="text-white/60 hover:text-white cursor-pointer border-0 bg-transparent"
          @click="feedbackMessage = null"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>
    </Transition>

    <!-- EXECUTIVE METRICS BENTO GRID -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white border border-brand-hair shadow-whisper space-y-1">
        <p class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Total Voucher
        </p>
        <p class="font-display text-2xl font-bold text-brand-ink">{{ metrics.total_coupons }}</p>
        <p class="text-[11px] text-brand-muted">Master voucher terdaftar</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-brand-hair shadow-whisper space-y-1">
        <p class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Voucher Aktif
        </p>
        <p class="font-display text-2xl font-bold text-emerald-600">{{ metrics.active_coupons }}</p>
        <p class="text-[11px] text-brand-muted">Siap digunakan saat checkout</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-brand-hair shadow-whisper space-y-1">
        <p class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Total Penggunaan
        </p>
        <p class="font-display text-2xl font-bold text-brand-ink">
          {{ metrics.total_usages }} kali
        </p>
        <p class="text-[11px] text-brand-muted">Tercatat di coupon_usages</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-brand-hair shadow-whisper space-y-1">
        <p class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Total Diskon Diberikan
        </p>
        <p class="font-display text-2xl font-bold text-brand-accent">
          {{ metrics.formatted_total_discount }}
        </p>
        <p class="text-[11px] text-brand-muted">Penghematan belanja pelanggan</p>
      </div>
    </div>

    <!-- FILTER & SEARCH BAR -->
    <div
      class="p-3 bg-white border border-brand-hair rounded-2xl shadow-whisper flex flex-col sm:flex-row items-center justify-between gap-3"
    >
      <div class="relative w-full sm:w-72">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari kode atau nama voucher..."
          class="w-full pl-9 pr-3 py-1.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink"
          @input="fetchCoupons"
        />
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
        <select
          v-model="statusFilter"
          class="px-3 py-1.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink focus:outline-none cursor-pointer"
          @change="fetchCoupons"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="expired">Kedaluwarsa</option>
        </select>

        <select
          v-model="typeFilter"
          class="px-3 py-1.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink focus:outline-none cursor-pointer"
          @change="fetchCoupons"
        >
          <option value="all">Semua Tipe</option>
          <option value="percentage">Persentase (%)</option>
          <option value="fixed">Nominal Tetap (Rp)</option>
        </select>

        <button
          type="button"
          class="px-3 py-1.5 rounded-full bg-brand-canvas-soft hover:bg-brand-hair text-xs font-semibold text-brand-ink transition-colors cursor-pointer border border-brand-hair"
          title="Segarkan data"
          @click="fetchCoupons"
        >
          <i class="pi pi-sync text-xs" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- DATA TABLE SECTION -->
    <div class="bg-white border border-brand-hair rounded-2xl shadow-whisper overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center space-y-3">
        <i class="pi pi-spinner animate-spin text-2xl text-brand-muted" />
        <p class="text-xs text-brand-muted">Memuat data voucher promosi...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="coupons.length === 0" class="p-12 text-center space-y-3">
        <i class="pi pi-ticket text-3xl text-brand-muted" />
        <h3 class="font-bold text-sm text-brand-ink">Tidak ada voucher yang cocok</h3>
        <p class="text-xs text-brand-muted max-w-sm mx-auto">
          Coba ganti filter status atau klik tombol "Buat Voucher Baru" untuk menambahkan promo
          pertama Anda.
        </p>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-brand-canvas-soft border-b border-brand-hair text-[11px] font-semibold text-brand-muted uppercase tracking-wider"
          >
            <tr>
              <th class="px-4 py-3">Kode Voucher</th>
              <th class="px-4 py-3">Nama &amp; Tipe</th>
              <th class="px-4 py-3">Nilai Diskon</th>
              <th class="px-4 py-3">Min. Belanja &amp; Pagu</th>
              <th class="px-4 py-3">Kuota Penggunaan</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="coupon in coupons"
              :key="coupon.id"
              class="hover:bg-brand-canvas-soft/50 transition-colors"
            >
              <!-- Kode -->
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-2">
                  <span
                    class="font-mono font-bold text-brand-ink bg-brand-canvas-soft border border-dashed border-brand-hair px-2.5 py-1 rounded-lg"
                  >
                    {{ coupon.code }}
                  </span>
                </div>
              </td>

              <!-- Nama & Tipe -->
              <td class="px-4 py-3.5">
                <div class="space-y-0.5">
                  <p class="font-semibold text-brand-ink m-0">{{ coupon.name }}</p>
                  <span
                    class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    :class="
                      coupon.discount_type === 'percentage'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                    "
                  >
                    {{ coupon.discount_type === 'percentage' ? 'Diskon Persen' : 'Nominal Tetap' }}
                  </span>
                </div>
              </td>

              <!-- Nilai Diskon -->
              <td class="px-4 py-3.5 font-bold text-brand-ink">
                {{ coupon.formatted_discount }}
              </td>

              <!-- Min Belanja & Pagu -->
              <td class="px-4 py-3.5 text-brand-muted">
                <div>Min: {{ coupon.formatted_min_purchase }}</div>
                <div class="text-[11px]">Pagu: {{ coupon.formatted_max_discount }}</div>
              </td>

              <!-- Kuota -->
              <td class="px-4 py-3.5">
                <div class="space-y-1 max-w-[120px]">
                  <div class="flex items-center justify-between text-[11px] text-brand-muted">
                    <span>{{ coupon.usage_count }}</span>
                    <span>/ {{ coupon.usage_limit != null ? coupon.usage_limit : '∞' }}</span>
                  </div>
                  <div
                    v-if="coupon.usage_limit"
                    class="w-full bg-brand-hair h-1.5 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full bg-brand-ink transition-all"
                      :style="{
                        width: `${Math.min(100, (coupon.usage_count / coupon.usage_limit) * 100)}%`,
                      }"
                    />
                  </div>
                </div>
              </td>

              <!-- Status -->
              <td class="px-4 py-3.5">
                <span
                  v-if="coupon.is_expired"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Kedaluwarsa</span>
                </span>
                <span
                  v-else-if="coupon.is_active"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Aktif</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span>Nonaktif</span>
                </span>
              </td>

              <!-- Aksi -->
              <td class="px-4 py-3.5 text-right">
                <div class="inline-flex items-center gap-1">
                  <!-- Toggle Switch -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-canvas transition-colors cursor-pointer border-0 bg-transparent"
                    :title="coupon.is_active ? 'Nonaktifkan voucher' : 'Aktifkan voucher'"
                    @click="toggleCouponStatus(coupon)"
                  >
                    <i
                      :class="
                        coupon.is_active
                          ? 'pi pi-eye-slash text-xs text-amber-600'
                          : 'pi pi-eye text-xs text-emerald-600'
                      "
                    />
                  </button>

                  <!-- Edit -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-canvas transition-colors cursor-pointer border-0 bg-transparent"
                    title="Ubah data voucher"
                    @click="openEditModal(coupon)"
                  >
                    <i class="pi pi-pencil text-xs" />
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border-0 bg-transparent"
                    title="Hapus voucher"
                    @click="confirmDelete(coupon)"
                  >
                    <i class="pi pi-trash text-xs" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM CREATE / EDIT DIALOG -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isModalOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
        @click.self="closeModal"
      >
        <div
          class="bg-white rounded-3xl border border-brand-hair shadow-floating w-full max-w-lg p-6 space-y-5 my-8"
        >
          <div class="flex items-center justify-between pb-3 border-b border-brand-hair">
            <div>
              <h3 class="font-display text-lg font-bold text-brand-ink">
                {{ isEditing ? 'Ubah Voucher Promosi' : 'Buat Voucher Promo Baru' }}
              </h3>
              <p class="text-xs text-brand-muted">
                {{
                  isEditing
                    ? 'Perbarui parameter diskon dan kuota voucher.'
                    : 'Lengkapi formulir untuk menerbitkan voucher baru.'
                }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full border border-brand-hair flex items-center justify-center text-brand-muted hover:text-brand-ink hover:bg-brand-canvas cursor-pointer"
              @click="closeModal"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Error Alert -->
          <div
            v-if="modalError"
            class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
          >
            <i class="pi pi-exclamation-circle text-sm shrink-0" />
            <span>{{ modalError }}</span>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Kode & Nama -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Kode Voucher <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  :disabled="isEditing"
                  placeholder="MISAL: DISKON20"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair font-mono text-xs uppercase font-bold text-brand-ink focus:outline-none focus:border-brand-ink disabled:opacity-60"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Nama Promo <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Misal: Promo Awal Bulan"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>
            </div>

            <!-- Deskripsi -->
            <div class="space-y-1">
              <label class="block text-xs font-semibold text-brand-ink">Deskripsi (Opsional)</label>
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="Penjelasan ringkas ketentuan voucher..."
                class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink resize-none"
              />
            </div>

            <!-- Tipe Diskon & Nilai -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">Tipe Diskon</label>
                <select
                  v-model="form.discount_type"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink focus:outline-none focus:border-brand-ink"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  {{
                    form.discount_type === 'percentage' ? 'Nilai Persen (%)' : 'Potongan (Rupiah)'
                  }}
                  <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model.number="form.discount_value"
                  type="number"
                  required
                  min="1"
                  :max="form.discount_type === 'percentage' ? 100 : 100000000"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs font-bold text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>
            </div>

            <!-- Pagu Maksimal & Min Belanja -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">
                  Maks. Diskon (Rp)
                  <span
                    v-if="form.discount_type === 'percentage'"
                    class="text-[10px] text-brand-muted"
                    >(Pagu)</span
                  >
                </label>
                <input
                  v-model.number="form.max_discount_rupiah"
                  type="number"
                  min="0"
                  placeholder="Kosongkan jika tanpa pagu"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink"
                  >Min. Pembelian (Rp)</label
                >
                <input
                  v-model.number="form.min_purchase_rupiah"
                  type="number"
                  min="0"
                  placeholder="0 (Tanpa minimum)"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>
            </div>

            <!-- Kuota Global & User Limit -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">Batas Kuota Total</label>
                <input
                  v-model.number="form.usage_limit"
                  type="number"
                  min="1"
                  placeholder="Kosongkan jika tak terbatas"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">Batas Per Pengguna</label>
                <input
                  v-model.number="form.user_limit"
                  type="number"
                  min="1"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>
            </div>

            <!-- Tanggal Mulai & Kedaluwarsa -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">Mulai Berlaku</label>
                <input
                  v-model="form.starts_at"
                  type="datetime-local"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-semibold text-brand-ink">Kedaluwarsa</label>
                <input
                  v-model="form.expires_at"
                  type="datetime-local"
                  class="w-full px-3 py-2 rounded-xl bg-brand-canvas-soft border border-brand-hair text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                />
              </div>
            </div>

            <!-- Checkbox Aktif -->
            <div class="flex items-center gap-2 pt-1">
              <input
                id="is_active_checkbox"
                v-model="form.is_active"
                type="checkbox"
                class="w-4 h-4 rounded text-brand-ink focus:ring-brand-ink cursor-pointer"
              />
              <label
                for="is_active_checkbox"
                class="text-xs font-semibold text-brand-ink cursor-pointer"
              >
                Aktifkan voucher ini langsung setelah disimpan
              </label>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-brand-hair">
              <button
                type="button"
                class="px-4 py-2 rounded-full border border-brand-hair bg-transparent text-xs font-semibold text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
                @click="closeModal"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-5 py-2 rounded-full bg-brand-ink text-white hover:bg-brand-inkhover transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-whisper"
              >
                <i v-if="submitting" class="pi pi-spinner animate-spin text-xs" />
                <span>{{
                  submitting ? 'Menyimpan...' : isEditing ? 'Perbarui Voucher' : 'Terbitkan Voucher'
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRMATION MODAL -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDeleteModalOpen && deletingCoupon"
        class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      >
        <div
          class="bg-white rounded-3xl border border-brand-hair shadow-floating w-full max-w-sm p-6 space-y-4"
        >
          <div
            class="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"
          >
            <i class="pi pi-trash text-base" />
          </div>

          <div class="space-y-1">
            <h3 class="font-display text-base font-bold text-brand-ink">
              Hapus Voucher "{{ deletingCoupon.code }}"?
            </h3>
            <p class="text-xs text-brand-muted leading-relaxed">
              Voucher ini akan di-arsip (soft delete). Pelanggan tidak akan dapat lagi menggunakan
              kode ini untuk checkout pesanan baru.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-full border border-brand-hair bg-transparent text-xs font-semibold text-brand-muted hover:text-brand-ink cursor-pointer"
              @click="isDeleteModalOpen = false"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="deleting"
              class="px-5 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60"
              @click="handleDelete"
            >
              <i v-if="deleting" class="pi pi-spinner animate-spin text-xs" />
              <span>{{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
