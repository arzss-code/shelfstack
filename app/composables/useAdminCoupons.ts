import { computed, ref, onMounted } from 'vue'
import type { CouponMetrics } from '~/components/admin/coupons/AdminCouponMetrics.vue'
import type { AdminCoupon } from '~/components/admin/coupons/AdminCouponTable.vue'
import type { CouponFormPayload } from '~/components/admin/coupons/AdminCouponModal.vue'
import { useUiToast } from '~/composables/useUiToast'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { useAdminDebouncedSearch } from '~/composables/useAdminDebouncedSearch'

export function useAdminCoupons() {
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

  const hasActiveFilters = computed(() =>
    Boolean(searchQuery.value.trim() || statusFilter.value !== 'all' || typeFilter.value !== 'all'),
  )

  const { runAbortable, triggerNow, clearQuery } = useAdminDebouncedSearch(searchQuery, () => {
    void fetchCoupons()
  })

  const fetchCoupons = async () => {
    await runAbortable(
      loading,
      async ({ signal, isCurrent }) => {
        const params: Record<string, string> = {}
        if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
        if (statusFilter.value !== 'all') params.status = statusFilter.value
        if (typeFilter.value !== 'all') params.discount_type = typeFilter.value

        const res = await $fetch<{
          status: string
          data: { coupons: AdminCoupon[]; metrics: CouponMetrics }
        }>('/api/admin/coupons', {
          query: params,
          signal,
        })

        if (!isCurrent()) return
        if (res?.data) {
          coupons.value = res.data.coupons
          metrics.value = res.data.metrics
        }
      },
      (err) => {
        const errObj = err as { data?: { message?: string } }
        toast.show({
          title: 'Gagal Memuat Data',
          message: errObj?.data?.message || 'Gagal memuat daftar voucher. Silakan refresh halaman.',
          tone: 'error',
        })
      },
    )
  }

  const resetFilters = () => {
    clearQuery()
    statusFilter.value = 'all'
    typeFilter.value = 'all'
    void fetchCoupons()
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

  return {
    coupons,
    metrics,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    isModalOpen,
    isEditing,
    selectedCoupon,
    submitting,
    modalError,
    isUsagesModalOpen,
    usagesCoupon,
    statusOptions,
    typeOptions,
    hasActiveFilters,
    fetchCoupons,
    resetFilters,
    triggerSearchNow: triggerNow,
    openCreateModal,
    openEditModal,
    openUsagesModal,
    handleModalSubmit,
    toggleCouponStatus,
    confirmDelete,
  }
}
