<script setup lang="ts">
import UiModal from '~/components/ui/UiModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import type { AdminCoupon } from './AdminCouponTable.vue'
import { useAdminCouponForm } from '~/composables/useAdminCouponForm'

export interface CouponFormPayload {
  code: string
  name: string
  description?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_cents?: number | null
  min_purchase_cents: number
  usage_limit?: number | null
  user_limit: number
  starts_at?: string | null
  expires_at?: string | null
  is_active: boolean
  coin_cost?: number | null
}

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  coupon: AdminCoupon | null
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: CouponFormPayload): void
  (e: 'close'): void
}>()

const modalTypeOptions = [
  { value: 'percentage', label: 'Persentase (%)' },
  { value: 'fixed', label: 'Nominal Tetap (Rp)' },
]

const {
  form,
  discountValueModel,
  maxDiscountModel,
  minPurchaseModel,
  usageLimitModel,
  userLimitModel,
  coinCostModel,
  handleFormSubmit,
} = useAdminCouponForm(props, (event, payload) => emit(event, payload))
</script>

<template>
  <UiModal
    :visible="visible"
    size="lg"
    :title="isEditing ? 'Ubah Voucher Promosi' : 'Buat Voucher Promo Baru'"
    :description="
      isEditing
        ? 'Perbarui parameter diskon, kuota, dan ketentuan penukaran koin.'
        : 'Lengkapi formulir untuk menerbitkan kode voucher promosi baru.'
    "
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <UiAlert v-if="error" tone="danger" title="Gagal Menyimpan">
        {{ error }}
      </UiAlert>

      <form id="coupon-form" class="space-y-4" @submit.prevent="handleFormSubmit">
        <!-- Kode & Nama -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UiInput
            id="coupon-code"
            v-model="form.code"
            label="Kode Voucher"
            placeholder="CONTOH: DISKON20"
            :disabled="isEditing"
          />

          <UiInput
            id="coupon-name"
            v-model="form.name"
            label="Nama Promo"
            placeholder="Contoh: Promo Gajian Awal Bulan"
          />
        </div>

        <!-- Deskripsi -->
        <UiTextarea
          id="coupon-description"
          v-model="form.description"
          label="Deskripsi Ketentuan (Opsional)"
          placeholder="Ringkasan syarat & ketentuan voucher bagi pelanggan..."
          :rows="2"
        />

        <!-- Tipe Diskon & Nilai -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            :label="form.discount_type === 'percentage' ? 'Nilai Persen (%)' : 'Potongan (Rupiah)'"
            numeric
          />
        </div>

        <!-- Pagu Maksimal & Min Belanja -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            label="Min. Belanja (Rp)"
            placeholder="0 (Tanpa minimum)"
            numeric
          />
        </div>

        <!-- Kuota Global & User Limit -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            label="Batas Per Pelanggan"
            placeholder="1"
            numeric
          />
        </div>

        <!-- Integrasi Loyalty Coins Hub -->
        <div class="space-y-3 rounded-xl border border-brand-hair bg-brand-canvas-soft/60 p-3.5">
          <div class="flex items-center gap-2">
            <input
              id="is_loyalty_checkbox"
              v-model="form.is_loyalty_voucher"
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded text-brand-ink focus:ring-brand-ink"
            />
            <label
              for="is_loyalty_checkbox"
              class="cursor-pointer text-xs font-semibold text-brand-ink"
            >
              Tersedia untuk Penukaran Koin Loyalitas
            </label>
          </div>

          <div v-if="form.is_loyalty_voucher" class="pt-1">
            <UiInput
              id="coupon-coin-cost"
              v-model="coinCostModel"
              type="number"
              label="Biaya Koin untuk Menukar (Koin)"
              placeholder="Contoh: 5000"
              numeric
            />
            <p class="mt-1 text-[11px] text-brand-muted">
              Voucher ini akan otomatis ditampilkan di katalog penukaran koin pelanggan di
              /account/points.
            </p>
          </div>
        </div>

        <!-- Tanggal Mulai & Kedaluwarsa -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            class="h-4 w-4 cursor-pointer rounded text-brand-ink focus:ring-brand-ink"
          />
          <label
            for="is_active_checkbox"
            class="cursor-pointer text-xs font-semibold text-brand-ink"
          >
            Aktifkan voucher ini langsung setelah disimpan
          </label>
        </div>
      </form>
    </div>

    <template #footer>
      <UiButton variant="outline" size="sm" @click="emit('close')"> Batal </UiButton>
      <UiButton variant="primary" size="sm" :loading="submitting" type="submit" form="coupon-form">
        {{ isEditing ? 'Perbarui Voucher' : 'Terbitkan Voucher' }}
      </UiButton>
    </template>
  </UiModal>
</template>
