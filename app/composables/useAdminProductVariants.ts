import { reactive, ref, watch, type Ref } from 'vue'
import { useUiToast } from '~/composables/useUiToast'

export interface ProductVariantAdminRow {
  id: string
  product_id: number
  sku: string
  name: string
  attributes: Record<string, string>
  price_cents: number | null
  stock: number
  is_active: boolean
}

export function useAdminProductVariants(
  getProductId: () => number | undefined,
  getVisible: () => boolean,
  onUpdated: () => void,
) {
  const toast = useUiToast()
  const variants: Ref<ProductVariantAdminRow[]> = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const restockingId = ref<string | null>(null)
  const errorMsg = ref<string | null>(null)
  const editingId = ref<string | null>(null)
  const restockQty = ref('5')
  const restockNotes = ref('')

  const form = reactive({
    sku: '',
    name: '',
    priceRupiah: '',
    stock: '0',
    is_active: true,
  })

  function resetForm() {
    editingId.value = null
    form.sku = ''
    form.name = ''
    form.priceRupiah = ''
    form.stock = '0'
    form.is_active = true
  }

  async function fetchVariants() {
    const pid = getProductId()
    if (!pid) return
    loading.value = true
    errorMsg.value = null
    try {
      const res = await $fetch<{ data: ProductVariantAdminRow[] }>(
        `/api/admin/products/${pid}/variants`,
      )
      variants.value = res.data || []
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      errorMsg.value = e.data?.message || e.message || 'Gagal memuat varian produk.'
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [getVisible(), getProductId()],
    ([visible, pid]) => {
      if (visible && pid) {
        resetForm()
        fetchVariants()
      } else {
        variants.value = []
        restockingId.value = null
        errorMsg.value = null
      }
    },
    { immediate: true },
  )

  function startEdit(variant: ProductVariantAdminRow) {
    editingId.value = variant.id
    form.sku = variant.sku
    form.name = variant.name
    form.priceRupiah =
      variant.price_cents !== null ? String(Math.round(variant.price_cents / 100)) : ''
    form.stock = String(variant.stock)
    form.is_active = variant.is_active
  }

  async function submitVariant() {
    const pid = getProductId()
    if (!pid) return
    saving.value = true
    errorMsg.value = null
    try {
      const parsedPrice = form.priceRupiah.trim()
      const priceCents = parsedPrice === '' ? null : Math.round(Number(parsedPrice) * 100)
      const payload = {
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        price_cents: priceCents,
        stock: Number(form.stock || 0),
        is_active: form.is_active,
      }
      if (editingId.value) {
        await $fetch(`/api/admin/products/${pid}/variants/${editingId.value}`, {
          method: 'PUT',
          body: payload,
        })
        toast.show({ title: 'Berhasil', message: 'Varian produk diperbarui.', tone: 'success' })
      } else {
        await $fetch(`/api/admin/products/${pid}/variants`, { method: 'POST', body: payload })
        toast.show({ title: 'Berhasil', message: 'Varian produk ditambahkan.', tone: 'success' })
      }
      resetForm()
      await fetchVariants()
      onUpdated()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      errorMsg.value = e.data?.message || e.message || 'Gagal menyimpan varian produk.'
    } finally {
      saving.value = false
    }
  }

  async function submitRestock(variantId: string) {
    const pid = getProductId()
    if (!pid) return
    const qty = Number.parseInt(restockQty.value, 10)
    if (Number.isNaN(qty) || qty <= 0) {
      errorMsg.value = 'Jumlah restock varian minimal 1 unit.'
      return
    }
    saving.value = true
    errorMsg.value = null
    try {
      await $fetch(`/api/admin/products/${pid}/restock`, {
        method: 'POST',
        body: {
          quantity: qty,
          variant_id: variantId,
          notes: restockNotes.value.trim() || undefined,
        },
      })
      toast.show({
        title: 'Restock Berhasil',
        message: `Stok ditambah ${qty} unit.`,
        tone: 'success',
      })
      restockingId.value = null
      restockNotes.value = ''
      await fetchVariants()
      onUpdated()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      errorMsg.value = e.data?.message || e.message || 'Gagal melakukan restock varian.'
    } finally {
      saving.value = false
    }
  }

  async function archiveVariant(variantId: string) {
    const pid = getProductId()
    if (!pid) return
    saving.value = true
    try {
      await $fetch(`/api/admin/products/${pid}/variants/${variantId}`, { method: 'DELETE' })
      toast.show({
        title: 'Diarsipkan',
        message: 'Varian produk berhasil dihapus.',
        tone: 'success',
      })
      await fetchVariants()
      onUpdated()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      errorMsg.value = e.data?.message || e.message || 'Gagal mengarsipkan varian.'
    } finally {
      saving.value = false
    }
  }

  return {
    variants,
    loading,
    saving,
    restockingId,
    errorMsg,
    editingId,
    restockQty,
    restockNotes,
    form,
    resetForm,
    startEdit,
    submitVariant,
    submitRestock,
    archiveVariant,
  }
}
