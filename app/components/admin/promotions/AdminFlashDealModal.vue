<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { formatRupiah } from '~/utils/format'

export interface FlashDealAdminRow {
  id: string
  product_id: number
  promo_price_cents: number
  discount_percentage: number
  quota: number
  claimed: number
  starts_at: string
  ends_at: string
  is_active: boolean
  products?: {
    id: number
    name: string
    price: number
    price_cents?: number | null
    stock: number
  } | null
}

interface ProductOptionRow {
  id: number
  name: string
  price: number
  price_cents?: number | null
  stock: number
}

const props = defineProps<{
  show: boolean
  editingDeal: FlashDealAdminRow | null
  products: ProductOptionRow[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const toast = useUiToast()
const saving = ref(false)
const errorMsg = ref<string | null>(null)

const isVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit('close')
  },
})

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = reactive({
  product_id: '',
  discount_percentage: '20',
  promo_price_rupiah: '',
  quota: '15',
  starts_local: '',
  ends_local: '',
  is_active: true,
})

const selectedProduct = computed(() =>
  props.products.find((p) => String(p.id) === String(form.product_id)),
)

const originalPriceCents = computed(() => {
  if (!selectedProduct.value) return 0
  return (
    selectedProduct.value.price_cents || Math.round(Number(selectedProduct.value.price || 0) * 100)
  )
})

const productOptions = computed(() => [
  { value: '', label: 'Pilih Produk Target' },
  ...props.products.map((p) => ({
    value: String(p.id),
    label: `${p.name} (${formatRupiah(p.price)} · Stok ${p.stock})`,
  })),
])

function syncPromoFromDiscount() {
  if (!originalPriceCents.value) return
  const pct = Math.min(99, Math.max(1, Number.parseInt(form.discount_percentage || '15', 10) || 15))
  const promoCents = Math.max(100, Math.round(originalPriceCents.value * ((100 - pct) / 100)))
  form.promo_price_rupiah = String(Math.round(promoCents / 100))
}

watch(
  () => [props.show, props.editingDeal],
  ([open]) => {
    if (!open) return
    errorMsg.value = null
    if (props.editingDeal) {
      form.product_id = String(props.editingDeal.product_id)
      form.discount_percentage = String(props.editingDeal.discount_percentage)
      form.promo_price_rupiah = String(Math.round(props.editingDeal.promo_price_cents / 100))
      form.quota = String(props.editingDeal.quota)
      form.starts_local = toLocalDatetime(props.editingDeal.starts_at)
      form.ends_local = toLocalDatetime(props.editingDeal.ends_at)
      form.is_active = props.editingDeal.is_active
    } else {
      const now = new Date()
      const later = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      form.product_id = props.products[0] ? String(props.products[0].id) : ''
      form.discount_percentage = '20'
      form.quota = '15'
      form.starts_local = toLocalDatetime(now.toISOString())
      form.ends_local = toLocalDatetime(later.toISOString())
      form.is_active = true
      syncPromoFromDiscount()
    }
  },
  { immediate: true },
)

watch(
  () => [form.product_id, form.discount_percentage],
  () => {
    if (!props.editingDeal) syncPromoFromDiscount()
  },
)

async function submitDeal() {
  errorMsg.value = null
  const startsDate = new Date(form.starts_local)
  const endsDate = new Date(form.ends_local)
  if (Number.isNaN(startsDate.getTime()) || Number.isNaN(endsDate.getTime())) {
    errorMsg.value = 'Silakan isi jadwal mulai dan berakhir yang valid.'
    return
  }
  const promoCents = Math.round(Number(form.promo_price_rupiah || '0') * 100)
  const payload = {
    product_id: Number(form.product_id),
    discount_percentage: Number(form.discount_percentage),
    promo_price_cents: promoCents,
    quota: Number(form.quota),
    starts_at: startsDate.toISOString(),
    ends_at: endsDate.toISOString(),
    is_active: form.is_active,
  }
  saving.value = true
  try {
    if (props.editingDeal) {
      await $fetch(`/api/admin/promotions/flash-deals/${props.editingDeal.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.show({ title: 'Berhasil', message: 'Kampanye flash sale diperbarui.', tone: 'success' })
    } else {
      await $fetch('/api/admin/promotions/flash-deals', {
        method: 'POST',
        body: payload,
      })
      toast.show({ title: 'Berhasil', message: 'Kampanye flash sale dibuat.', tone: 'success' })
    }
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || 'Gagal menyimpan kampanye flash sale.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiModal
    v-model:visible="isVisible"
    size="md"
    :title="editingDeal ? 'Edit Kampanye Flash Sale' : 'Buat Kampanye Flash Sale'"
    description="Jadwalkan promo terbatas yang terhubung langsung ke hitung mundur beranda dan validasi harga checkout."
  >
    <form class="space-y-4" @submit.prevent="submitDeal">
      <UiAlert v-if="errorMsg" tone="danger" class="text-xs">{{ errorMsg }}</UiAlert>

      <UiSelect v-model="form.product_id" label="Produk Promo" :options="productOptions" block />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UiInput
          v-model="form.discount_percentage"
          label="Diskon (%)"
          type="number"
          numeric
          :min="1"
          :max="99"
          @input="syncPromoFromDiscount"
        />
        <UiInput
          v-model="form.promo_price_rupiah"
          label="Harga Promo (IDR)"
          type="number"
          numeric
          :min="100"
        />
        <UiInput v-model="form.quota" label="Kuota Unit" type="number" numeric :min="1" />
      </div>

      <p v-if="originalPriceCents > 0" class="m-0 text-xs text-brand-muted">
        Harga normal:
        <strong class="text-brand-ink">{{ formatRupiah(originalPriceCents / 100) }}</strong>
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block space-y-1 text-xs font-medium text-brand-ink">
          <span>Waktu Mulai</span>
          <input
            v-model="form.starts_local"
            type="datetime-local"
            class="w-full rounded-field border border-brand-hair bg-brand-canvas px-3 py-2 text-xs text-brand-ink"
          />
        </label>
        <label class="block space-y-1 text-xs font-medium text-brand-ink">
          <span>Waktu Berakhir</span>
          <input
            v-model="form.ends_local"
            type="datetime-local"
            class="w-full rounded-field border border-brand-hair bg-brand-canvas px-3 py-2 text-xs text-brand-ink"
          />
        </label>
      </div>

      <label
        class="inline-flex items-center gap-2 text-xs font-medium text-brand-ink cursor-pointer"
      >
        <input v-model="form.is_active" type="checkbox" class="rounded border-brand-hair" />
        <span>Aktifkan kampanye selama rentang jadwal</span>
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <UiButton type="button" variant="secondary" @click="emit('close')">Batal</UiButton>
        <UiButton type="submit" variant="primary" :loading="saving">
          {{ editingDeal ? 'Simpan Perubahan' : 'Buat Kampanye' }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>
