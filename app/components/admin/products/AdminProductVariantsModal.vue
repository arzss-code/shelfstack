<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useAdminProductVariants } from '~/composables/useAdminProductVariants'

const props = defineProps<{
  show: boolean
  product: Product | null
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const isVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit('close')
  },
})

const {
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
} = useAdminProductVariants(
  () => props.product?.id,
  () => props.show,
  () => emit('updated'),
)
</script>

<template>
  <UiModal
    v-model:visible="isVisible"
    size="lg"
    :title="`Kelola Varian & SKU: ${product?.name || ''}`"
    description="Atur SKU, harga override, status aktif, dan restock per varian secara atomik."
  >
    <div class="space-y-5">
      <UiAlert v-if="errorMsg" tone="danger" class="text-xs">{{ errorMsg }}</UiAlert>

      <form
        class="rounded-card border border-brand-hair bg-brand-canvas-soft p-4 space-y-3"
        @submit.prevent="submitVariant"
      >
        <div class="flex items-center justify-between gap-2">
          <h4 class="m-0 font-display text-sm font-bold text-brand-ink">
            {{ editingId ? 'Edit Varian Terpilih' : 'Tambah Varian Baru' }}
          </h4>
          <UiButton v-if="editingId" type="button" variant="ghost" size="sm" @click="resetForm">
            Batal Edit
          </UiButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UiInput v-model="form.sku" label="Kode SKU" placeholder="SHF-KB-BLK" size="sm" />
          <UiInput
            v-model="form.name"
            label="Nama Varian"
            placeholder="Hitam Anodized / Switch Tactile"
            size="sm"
          />
          <UiInput
            v-model="form.priceRupiah"
            label="Harga Override (IDR, opsional)"
            type="number"
            numeric
            placeholder="Kosongkan untuk harga induk"
            size="sm"
          />
          <UiInput
            v-model="form.stock"
            label="Stok Awal"
            type="number"
            numeric
            :min="0"
            size="sm"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label
            class="inline-flex items-center gap-2 text-xs font-medium text-brand-ink cursor-pointer"
          >
            <input v-model="form.is_active" type="checkbox" class="rounded border-brand-hair" />
            <span>Varian aktif di etalase</span>
          </label>
          <UiButton type="submit" variant="primary" size="sm" :loading="saving">
            {{ editingId ? 'Simpan Perubahan' : 'Tambah Varian' }}
          </UiButton>
        </div>
      </form>

      <div v-if="loading" class="space-y-2 py-4">
        <div v-for="i in 3" :key="i" class="h-12 rounded-card bg-brand-field animate-pulse" />
      </div>

      <UiEmptyState
        v-else-if="variants.length === 0"
        icon="pi-sitemap"
        title="Belum Ada Varian"
        description="Produk ini menggunakan stok tunggal. Tambahkan varian di atas bila memiliki opsi SKU berbeda."
      />

      <div v-else class="divide-y divide-brand-hairsoft border border-brand-hair rounded-card">
        <div v-for="v in variants" :key="v.id" class="p-3.5 space-y-2.5 bg-brand-canvas">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-sm text-brand-ink">{{ v.name }}</span>
                <span
                  class="rounded border border-brand-hair bg-brand-field px-2 py-0.5 text-xs text-brand-muted"
                >
                  {{ v.sku }}
                </span>
                <UiBadge
                  :variant="v.is_active ? 'success' : 'default'"
                  :label="v.is_active ? 'Aktif' : 'Nonaktif'"
                />
              </div>
              <p class="m-0 mt-1 text-xs text-brand-muted tabular-nums">
                Harga:
                {{
                  v.price_cents !== null
                    ? formatRupiah(v.price_cents / 100)
                    : 'Mengikuti produk induk'
                }}
                · Stok: <strong class="text-brand-ink">{{ v.stock }} unit</strong>
              </p>
            </div>

            <div class="flex items-center gap-1.5">
              <UiButton
                size="sm"
                variant="outline"
                @click="restockingId = restockingId === v.id ? null : v.id"
              >
                + Stok
              </UiButton>
              <UiButton size="sm" variant="secondary" @click="startEdit(v)">Edit</UiButton>
              <UiButton size="sm" variant="danger" @click="archiveVariant(v.id)">Hapus</UiButton>
            </div>
          </div>

          <div
            v-if="restockingId === v.id"
            class="rounded-card border border-brand-hair bg-brand-canvas-soft p-3 flex flex-wrap items-end gap-2"
          >
            <div class="w-24">
              <UiInput
                v-model="restockQty"
                label="Qty (+)"
                type="number"
                numeric
                :min="1"
                size="sm"
              />
            </div>
            <div class="flex-1 min-w-[160px]">
              <UiInput
                v-model="restockNotes"
                label="Catatan Mutasi"
                placeholder="Restock batch masuk"
                size="sm"
              />
            </div>
            <UiButton size="sm" variant="primary" :loading="saving" @click="submitRestock(v.id)">
              Simpan Stok
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>
