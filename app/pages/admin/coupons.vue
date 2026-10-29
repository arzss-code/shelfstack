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

const toast = useUiToast()
const confirm = useUiConfirm()

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

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'expired', label: 'Kedaluwarsa' },
]

const typeOptions = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'percentage', label: 'Persen (%)' },
  { value: 'fixed', label: 'Nominal (Rp)' },
]

const modalTypeOptions = [
  { value: 'percentage', label: 'Persentase (%)' },
  { value: 'fixed', label: 'Nominal Tetap (Rp)' },
]

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

// Numeric adapters for UiInput
const discountValueModel = computed({
  get: () => String(form.value.discount_value ?? ''),
  set: (val: string) => {
    form.value.discount_value = Number(val) || 0
  },
})

const maxDiscountModel = computed({
  get: () => (form.value.max_discount_rupiah != null ? String(form.value.max_discount_rupiah) : ''),
  set: (val: string) => {
    form.value.max_discount_rupiah = val.trim() ? Number(val) : null
  },
})

const minPurchaseModel = computed({
  get: () => String(form.value.min_purchase_rupiah ?? 0),
  set: (val: string) => {
    form.value.min_purchase_rupiah = Number(val) || 0
  },
})

const usageLimitModel = computed({
  get: () => (form.value.usage_limit != null ? String(form.value.usage_limit) : ''),
  set: (val: string) => {
    form.value.usage_limit = val.trim() ? Number(val) : null
  },
})

const userLimitModel = computed({
  get: () => String(form.value.user_limit ?? 1),
  set: (val: string) => {
    form.value.user_limit = Number(val) || 1
  },
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
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Data',
      detail: err?.data?.message || 'Gagal memuat daftar voucher. Silakan refresh halaman.',
      life: 5000,
    })
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
      toast.add({
        severity: 'success',
        summary: 'Voucher Dibuat',
        detail: `Voucher "${payload.code}" berhasil diterbitkan.`,
        life: 4000,
      })
    } else if (editingId.value) {
      await $fetch(`/api/admin/coupons/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({
        severity: 'success',
        summary: 'Voucher Diperbarui',
        detail: `Voucher "${form.value.code}" berhasil diperbarui.`,
        life: 4000,
      })
    }

    closeModal()
    await fetchCoupons()
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
    toast.add({
      severity: 'info',
      summary: 'Status Diperbarui',
      detail: `Status voucher "${coupon.code}" diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`,
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memperbarui Status',
      detail: err?.data?.message || 'Gagal memperbarui status voucher.',
      life: 4000,
    })
  }
}

const confirmDelete = (coupon: AdminCoupon) => {
  confirm.require({
    header: `Hapus Voucher "${coupon.code}"?`,
    message:
      'Voucher ini akan di-arsip (soft delete). Pelanggan tidak akan dapat lagi menggunakan kode ini untuk checkout pesanan baru.',
    tone: 'danger',
    acceptLabel: 'Ya, Hapus',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await $fetch(`/api/admin/coupons/${coupon.id}`, {
          method: 'DELETE',
        })
        toast.add({
          severity: 'success',
          summary: 'Voucher Dihapus',
          detail: `Voucher "${coupon.code}" berhasil dihapus.`,
          life: 4000,
        })
        await fetchCoupons()
      } catch (err: any) {
        toast.add({
          severity: 'error',
          summary: 'Gagal Menghapus',
          detail: err?.data?.message || 'Gagal menghapus voucher.',
          life: 4000,
        })
      }
    },
  })
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

      <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreateModal">
        Buat Voucher Baru
      </UiButton>
    </div>

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

    <!-- FILTER & SEARCH BAR MENGGUNAKAN UiInput & UiSelect -->
    <div
      class="relative z-20 p-3 bg-white border border-brand-hair rounded-2xl shadow-whisper flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
    >
      <div class="w-full sm:w-72">
        <UiInput
          v-model="searchQuery"
          size="sm"
          placeholder="Cari kode atau nama voucher..."
          left-icon="pi-search"
          @input="fetchCoupons"
        />
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
        <div class="w-full sm:w-36">
          <UiSelect
            v-model="statusFilter"
            size="sm"
            block
            :options="statusOptions"
            @change="fetchCoupons"
          />
        </div>

        <div class="w-full sm:w-44">
          <UiSelect
            v-model="typeFilter"
            size="sm"
            block
            align="right"
            :options="typeOptions"
            @change="fetchCoupons"
          />
        </div>

        <UiIconButton
          icon="pi-sync"
          label="Segarkan data"
          variant="neutral"
          size="sm"
          :loading="loading"
          @click="fetchCoupons"
        />
      </div>
    </div>

    <!-- DATA TABLE SECTION -->
    <div class="bg-white border border-brand-hair rounded-2xl shadow-whisper overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center space-y-3">
        <i class="pi pi-spinner animate-spin text-2xl text-brand-muted" />
        <p class="text-xs text-brand-muted">Memuat data voucher promosi...</p>
      </div>

      <!-- Empty State Menggunakan UiEmptyState Resmi -->
      <div v-else-if="coupons.length === 0" class="p-4">
        <UiEmptyState
          icon="pi-ticket"
          title="Tidak ada voucher yang cocok"
          description="Coba ganti filter status atau klik tombol di bawah untuk membuat voucher baru."
          action-label="Buat Voucher Baru"
          @action="openCreateModal"
        />
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

              <!-- Nama & Tipe Menggunakan UiBadge -->
              <td class="px-4 py-3.5">
                <div class="space-y-1">
                  <p class="font-semibold text-brand-ink m-0">{{ coupon.name }}</p>
                  <UiBadge
                    :label="coupon.discount_type === 'percentage' ? 'Persen' : 'Nominal'"
                    :variant="coupon.discount_type === 'percentage' ? 'info' : 'default'"
                  />
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

              <!-- Status Menggunakan UiBadge Resmi (Tanpa Glowing Dot) -->
              <td class="px-4 py-3.5">
                <UiBadge
                  :label="
                    coupon.is_expired ? 'Kedaluwarsa' : coupon.is_active ? 'Aktif' : 'Nonaktif'
                  "
                  :variant="coupon.is_expired ? 'danger' : coupon.is_active ? 'success' : 'default'"
                />
              </td>

              <!-- Aksi Menggunakan UiIconButton Resmi -->
              <td class="px-4 py-3.5 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <UiIconButton
                    :icon="coupon.is_active ? 'pi-eye-slash' : 'pi-eye'"
                    :label="coupon.is_active ? 'Nonaktifkan voucher' : 'Aktifkan voucher'"
                    variant="neutral"
                    size="sm"
                    @click="toggleCouponStatus(coupon)"
                  />

                  <UiIconButton
                    icon="pi-pencil"
                    label="Ubah voucher"
                    variant="neutral"
                    size="sm"
                    @click="openEditModal(coupon)"
                  />

                  <UiIconButton
                    icon="pi-trash"
                    label="Hapus voucher"
                    variant="danger"
                    size="sm"
                    @click="confirmDelete(coupon)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM CREATE / EDIT DIALOG MENGGUNAKAN UiModal -->
    <UiModal
      v-model:visible="isModalOpen"
      size="lg"
      :title="isEditing ? 'Ubah Voucher Promosi' : 'Buat Voucher Promo Baru'"
      :description="
        isEditing
          ? 'Perbarui parameter diskon dan kuota voucher.'
          : 'Lengkapi formulir untuk menerbitkan voucher baru.'
      "
    >
      <div class="space-y-4">
        <!-- Error Alert Menggunakan UiAlert -->
        <UiAlert v-if="modalError" tone="danger" title="Gagal Menyimpan">
          {{ modalError }}
        </UiAlert>

        <form id="coupon-form" class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Kode & Nama -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UiInput
              id="coupon-code"
              v-model="form.code"
              label="Kode Voucher"
              placeholder="MISAL: DISKON20"
              :disabled="isEditing"
            />

            <UiInput
              id="coupon-name"
              v-model="form.name"
              label="Nama Promo"
              placeholder="Misal: Promo Awal Bulan"
            />
          </div>

          <!-- Deskripsi -->
          <UiTextarea
            id="coupon-description"
            v-model="form.description"
            label="Deskripsi (Opsional)"
            placeholder="Penjelasan ringkas ketentuan voucher..."
            :rows="2"
          />

          <!-- Tipe Diskon & Nilai -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UiSelect
              id="coupon-type"
              v-model="form.discount_type"
              label="Tipe Diskon"
              :options="modalTypeOptions"
              block
            />

            <UiInput
              id="coupon-value"
              v-model="discountValueModel"
              type="number"
              :label="
                form.discount_type === 'percentage' ? 'Nilai Persen (%)' : 'Potongan (Rupiah)'
              "
              numeric
            />
          </div>

          <!-- Pagu Maksimal & Min Belanja -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UiInput
              id="coupon-max-discount"
              v-model="maxDiscountModel"
              type="number"
              :label="
                form.discount_type === 'percentage' ? 'Maks. Diskon (Rp) (Pagu)' : 'Maks. Diskon'
              "
              placeholder="Kosongkan jika tanpa pagu"
              numeric
            />

            <UiInput
              id="coupon-min-purchase"
              v-model="minPurchaseModel"
              type="number"
              label="Min. Pembelian (Rp)"
              placeholder="0 (Tanpa minimum)"
              numeric
            />
          </div>

          <!-- Kuota Global & User Limit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UiInput
              id="coupon-usage-limit"
              v-model="usageLimitModel"
              type="number"
              label="Batas Kuota Total"
              placeholder="Kosongkan jika tak terbatas"
              numeric
            />

            <UiInput
              id="coupon-user-limit"
              v-model="userLimitModel"
              type="number"
              label="Batas Per Pengguna"
              placeholder="1"
              numeric
            />
          </div>

          <!-- Tanggal Mulai & Kedaluwarsa -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UiInput
              id="coupon-starts-at"
              v-model="form.starts_at"
              type="datetime-local"
              label="Mulai Berlaku"
            />

            <UiInput
              id="coupon-expires-at"
              v-model="form.expires_at"
              type="datetime-local"
              label="Kedaluwarsa"
            />
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
        </form>
      </div>

      <template #footer>
        <UiButton variant="outline" size="sm" @click="closeModal"> Batal </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :loading="submitting"
          type="submit"
          form="coupon-form"
        >
          {{ isEditing ? 'Perbarui Voucher' : 'Terbitkan Voucher' }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
