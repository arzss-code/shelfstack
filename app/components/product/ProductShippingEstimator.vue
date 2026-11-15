<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatRupiah } from '~/utils/format'
import { shippingRateTiers, type ShippingRateTier } from '~~/shared/schemas/shipping'

const props = defineProps<{
  productPrice: number
}>()

const isOpen = ref(false)
const selectedCity = ref('Jakarta Selatan')

const popularCities = [
  'Jakarta Selatan',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Medan',
  'Makassar',
  'Denpasar',
]

const subtotalCents = computed(() => Math.round(props.productPrice * 100))

const calculatedTiers = computed(() => {
  return shippingRateTiers.map((tier: ShippingRateTier) => {
    const isFree = Boolean(
      tier.freeThresholdCents && subtotalCents.value >= tier.freeThresholdCents,
    )
    const costRupiah = isFree ? 0 : tier.baseFeeCents / 100

    return {
      id: tier.id,
      name: tier.name,
      etd: tier.etd,
      description: tier.description,
      isFree,
      formattedCost: isFree ? 'Gratis' : formatRupiah(costRupiah),
    }
  })
})

const freeShippingDeficit = computed(() => {
  const threshold = 500000
  const diff = threshold - props.productPrice
  return diff > 0 ? diff : 0
})
</script>

<template>
  <div
    class="rounded-2xl border border-brand-hair bg-brand-canvas-soft p-4 shadow-whisper transition-all duration-300"
  >
    <!-- Accordion Trigger Header -->
    <button
      type="button"
      class="flex w-full items-center justify-between text-left cursor-pointer bg-transparent border-0 p-0 text-brand-ink"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-canvas border border-brand-hair text-brand-muted shrink-0"
        >
          <i class="pi pi-truck text-xs" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="font-display text-xs font-bold text-brand-ink m-0">
            Estimasi Ongkos Kirim &amp; Waktu Tiba
          </p>
          <p class="text-[11px] text-brand-muted m-0 truncate">
            Tujuan: <span class="font-semibold text-brand-ink">{{ selectedCity }}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="freeShippingDeficit === 0"
          class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold"
        >
          Bebas Ongkir
        </span>
        <i
          class="pi pi-chevron-down text-xs text-brand-muted transition-transform duration-300"
          :class="{ 'rotate-180': isOpen }"
          aria-hidden="true"
        />
      </div>
    </button>

    <!-- Expandable Content -->
    <div v-show="isOpen" class="mt-4 pt-3 border-t border-brand-hairsoft space-y-3">
      <!-- Destination City Selector -->
      <div>
        <label class="block text-[11px] font-semibold text-brand-muted mb-1.5"
          >Pilih Kota Tujuan Pengiriman</label
        >
        <select
          v-model="selectedCity"
          class="w-full rounded-xl border border-brand-hair bg-brand-canvas px-3 py-2 text-xs font-medium text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
        >
          <option v-for="city in popularCities" :key="city" :value="city">
            {{ city }}
          </option>
        </select>
      </div>

      <!-- Free Shipping Promotion Tip -->
      <div
        v-if="freeShippingDeficit > 0"
        class="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-800"
      >
        <p class="m-0">
          Tambah belanja <strong>{{ formatRupiah(freeShippingDeficit) }}</strong> lagi untuk
          mendapatkan <strong>Bebas Ongkir</strong> layanan Reguler.
        </p>
      </div>

      <!-- Shipping Rates Matrix -->
      <div
        class="divide-y divide-brand-hairsoft rounded-xl border border-brand-hair bg-brand-canvas"
      >
        <div
          v-for="tier in calculatedTiers"
          :key="tier.id"
          class="flex items-center justify-between p-3 text-xs"
        >
          <div class="space-y-0.5 min-w-0 pr-2">
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-brand-ink">{{ tier.name }}</span>
              <span class="text-[10px] text-brand-muted">({{ tier.etd }})</span>
            </div>
            <p class="text-[10px] text-brand-muted m-0 truncate">
              {{ tier.description }}
            </p>
          </div>

          <span
            class="font-display font-bold tabular-nums whitespace-nowrap"
            :class="tier.isFree ? 'text-emerald-600' : 'text-brand-ink'"
          >
            {{ tier.formattedCost }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
