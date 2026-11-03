<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiIconButton from '~/components/ui/UiIconButton.vue'
import AdminCouponMetrics from '~/components/admin/coupons/AdminCouponMetrics.vue'
import type { CouponMetrics } from '~/components/admin/coupons/AdminCouponMetrics.vue'
import AdminCouponTable from '~/components/admin/coupons/AdminCouponTable.vue'
import type { AdminCoupon } from '~/components/admin/coupons/AdminCouponTable.vue'
import AdminCouponModal from '~/components/admin/coupons/AdminCouponModal.vue'
import type { CouponFormPayload } from '~/components/admin/coupons/AdminCouponModal.vue'
import AdminCouponUsagesModal from '~/components/admin/coupons/AdminCouponUsagesModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Voucher - ShelfStack Admin',
  description:
    'Kelola kode kupon diskon, voucher koin loyalitas, dan pantau riwayat audit pemakaian promo.',
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
const selectedCoupon = ref<AdminCoupon | null>(null)
const submitting = ref(false)
const modalError = ref<string | null>(null)

const isUsagesModalOpen = ref(false)
const usagesCoupon = ref<AdminCoupon | null>(null)

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
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } }
    toast.show({
      title: 'Gagal Memuat Data',
      message: errObj?.data?.message || 'Gagal memuat daftar voucher. Silakan refresh halaman.',
      tone: 'error',
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
  selectedCoupon.value = null
  modalError.value = null
  isModalOpen.value = true
}

const openEditModal = (coupon: AdminCoupon) => {
  isEditing.value = true
  selectedCoupon.value = coupon
  modalError.value = null
  isModalOpen.value = true
}

const openUsagesModal = (coupon: AdminCoupon) => {
  usagesCoupon.value = coupon
  isUsagesModalOpen.value = true
}

const handleModalSubmit = async (payload: CouponFormPayload) => {
  submitting.value = true
  modalError.value = null

  try {
    if (!isEditing.value) {
      await $fetch('/api/admin/coupons', {
        method: 'POST',
        body: payload,
      })
      toast.show({
        title: 'Voucher Diterbitkan',
        message: `Voucher promo "${payload.code}" berhasil dibuat.`,
        tone: 'success',
      })
    } else if (selectedCoupon.value?.id) {
      await $fetch(`/api/admin/coupons/${selectedCoupon.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.show({
        title: 'Voucher Diperbarui',
        message: `Voucher promo "${selectedCoupon.value.code}" berhasil diperbarui.`,
        tone: 'success',
      })
    }

    isModalOpen.value = false
    await fetchCoupons()
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string }; message?: string }
    modalError.value =
      errObj?.data?.message ||
      errObj?.message ||
      'Gagal menyimpan voucher. Periksa input data Anda.'
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
    toast.show({
      title: 'Status Diperbarui',
      message: `Status voucher "${coupon.code}" diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`,
      tone: 'info',
    })
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } }
    toast.show({
      title: 'Gagal Memperbarui Status',
      message: errObj?.data?.message || 'Gagal memperbarui status voucher.',
      tone: 'error',
    })
  }
}

const confirmDelete = (coupon: AdminCoupon) => {
  confirm.require({
    header: `Hapus Voucher "${coupon.code}"?`,
    message:
      'Voucher ini akan diarsipkan (soft delete). Pelanggan tidak akan dapat lagi menggunakan kode ini untuk checkout transaksi baru.',
    tone: 'danger',
    acceptLabel: 'Ya, Hapus',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await $fetch(`/api/admin/coupons/${coupon.id}`, {
          method: 'DELETE',
        })
        toast.show({
          title: 'Voucher Dihapus',
          message: `Voucher "${coupon.code}" berhasil dihapus.`,
          tone: 'success',
        })
        await fetchCoupons()
      } catch (err: unknown) {
        const errObj = err as { data?: { message?: string } }
        toast.show({
          title: 'Gagal Menghapus',
          message: errObj?.data?.message || 'Gagal menghapus voucher.',
          tone: 'error',
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
      class="flex flex-col justify-between gap-4 border-b border-brand-hair pb-4 sm:flex-row sm:items-center"
    >
      <div>
        <div class="mb-1 flex items-center gap-2 text-xs text-brand-muted">
          <NuxtLink to="/admin" class="no-underline hover:text-brand-ink"> Dashboard </NuxtLink>
          <span class="text-brand-faint">/</span>
          <span class="font-semibold text-brand-ink">Kelola Voucher</span>
        </div>
        <h1 class="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
          Kelola Voucher Promo
        </h1>
        <p class="mt-0.5 text-xs text-brand-muted sm:text-sm">
          Atur kode promo belanja, voucher penukaran koin loyalitas, dan pantau riwayat audit kuota.
        </p>
      </div>

      <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreateModal">
        Buat Voucher Baru
      </UiButton>
    </div>

    <!-- Executive Metrics Bento Grid -->
    <AdminCouponMetrics :metrics="metrics" />

    <!-- Filter & Search Bar -->
    <div
      class="relative z-20 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-hair bg-white p-3 shadow-whisper sm:flex-row sm:items-center"
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

      <div class="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:flex-nowrap">
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

    <!-- Data Table Subcomponent -->
    <AdminCouponTable
      :coupons="coupons"
      :loading="loading"
      @toggle-status="toggleCouponStatus"
      @edit="openEditModal"
      @delete="confirmDelete"
      @view-usages="openUsagesModal"
      @create="openCreateModal"
    />

    <!-- Create & Edit Modal Subcomponent -->
    <AdminCouponModal
      v-model:visible="isModalOpen"
      :is-editing="isEditing"
      :coupon="selectedCoupon"
      :submitting="submitting"
      :error="modalError"
      @submit="handleModalSubmit"
      @close="isModalOpen = false"
    />

    <!-- Coupon Usages Detail Modal Subcomponent -->
    <AdminCouponUsagesModal
      v-model:visible="isUsagesModalOpen"
      :coupon="usagesCoupon"
      @close="isUsagesModalOpen = false"
    />
  </div>
</template>
