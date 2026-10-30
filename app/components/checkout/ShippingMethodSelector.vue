<script setup lang="ts">
import { computed } from 'vue'
import {
  type ShippingService,
  shippingRateOptions,
  calculateShippingFee,
  supportedCouriers,
} from '~~/shared/schemas/shipping'
import { formatRupiah } from '~/utils/format'

const props = withDefaults(
  defineProps<{
    modelValue: ShippingService
    selectedCourier?: string | null
    subtotalCents: number
    disabled?: boolean
  }>(),
  {
    selectedCourier: null,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [service: ShippingService]
  'update:selectedCourier': [courier: string | null]
}>()

const serviceKeys: ShippingService[] = ['reguler', 'express', 'instant', 'cargo']

const servicesWithPricing = computed(() => {
  return serviceKeys.map((key) => {
    const opt = shippingRateOptions[key]
    const calc = calculateShippingFee(key, props.subtotalCents)
    return {
      key,
      name: key === 'express' ? 'Kilat / Next Day' : opt.name,
      description: opt.description,
      eta: opt.eta,
      feeCents: calc.feeCents,
      isFree: calc.isFree,
      formattedPrice: calc.isFree ? 'Gratis' : formatRupiah(calc.feeCents / 100),
    }
  })
})

const selectService = (service: ShippingService) => {
  if (props.disabled) return
  emit('update:modelValue', service)
}

const selectCourier = (courierCode: string | null) => {
  if (props.disabled) return
  emit('update:selectedCourier', courierCode)
}

const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
  if (props.disabled) return
  let nextIndex = currentIndex
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    nextIndex = (currentIndex + 1) % serviceKeys.length
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    nextIndex = (currentIndex - 1 + serviceKeys.length) % serviceKeys.length
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    const activeService = serviceKeys[currentIndex]
    if (activeService) {
      selectService(activeService)
    }
    return
  }
  const nextService = serviceKeys[nextIndex]
  if (nextService) {
    selectService(nextService)
  }
}
</script>

<template>
  <div
    class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-5"
    :class="{ 'opacity-60 pointer-events-none': disabled }"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
      <div class="flex items-center gap-2">
        <i class="pi pi-truck text-brand-accent text-base" />
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Metode Pengiriman</h2>
      </div>
      <span class="text-[11px] text-brand-muted">Estimasi &amp; Mitra Logistik</span>
    </div>

    <!-- Service Options Radio Group (Stacked Clean Cards) -->
    <div role="radiogroup" aria-label="Pilihan Layanan Pengiriman" class="space-y-2.5">
      <div
        v-for="(svc, index) in servicesWithPricing"
        :key="svc.key"
        role="radio"
        :aria-checked="modelValue === svc.key"
        :tabindex="modelValue === svc.key ? 0 : -1"
        :data-testid="`shipping-option-${svc.key}`"
        class="group relative flex items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-card border transition-all duration-150 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
        :class="[
          modelValue === svc.key
            ? 'border-brand-ink bg-brand-canvas-soft/40 shadow-2xs ring-1 ring-brand-ink/10'
            : 'border-brand-hair hover:border-brand-ink/40 bg-white hover:bg-brand-canvas-soft/20',
        ]"
        @click="selectService(svc.key)"
        @keydown="handleKeydown($event, index)"
      >
        <div class="flex items-start sm:items-center gap-3.5 min-w-0 pr-3">
          <!-- Refined Radio Button Indicator -->
          <div
            class="w-4.5 h-4.5 mt-0.5 sm:mt-0 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150"
            :class="[
              modelValue === svc.key
                ? 'border-2 border-brand-ink bg-white shadow-2xs'
                : 'border border-brand-hair bg-white group-hover:border-brand-ink/60',
            ]"
          >
            <div
              v-if="modelValue === svc.key"
              class="w-2 h-2 rounded-full bg-brand-ink transition-transform duration-150 scale-100"
            />
          </div>

          <!-- Service Info -->
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-display font-bold text-xs sm:text-sm text-brand-ink">
                {{ svc.name }}
              </span>
              <span class="text-xs text-brand-muted"> · {{ svc.eta }} </span>
            </div>
            <p class="text-xs text-brand-muted m-0 mt-0.5 leading-normal">
              {{ svc.description }}
            </p>
          </div>
        </div>

        <!-- Price or Free Badge -->
        <div class="shrink-0 text-right self-start sm:self-center">
          <template v-if="svc.isFree">
            <UiBadge label="Bebas Ongkir" variant="success" class="text-[11px]" />
          </template>
          <template v-else>
            <span class="font-display font-bold text-xs sm:text-sm text-brand-ink tabular-nums">
              {{ svc.formattedPrice }}
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- Preferred Courier Pills -->
    <div class="pt-3 border-t border-brand-hairsoft space-y-2.5">
      <div class="flex items-center justify-between">
        <div>
          <label class="block text-xs font-semibold text-brand-ink">Preferensi Mitra Kurir</label>
          <p class="text-[11px] text-brand-muted m-0">
            Pilih kurir favorit Anda atau biarkan sistem memilihkan yang terbaik
          </p>
        </div>
        <span class="text-[11px] text-brand-muted">Opsional</span>
      </div>

      <div class="flex flex-wrap gap-2 pt-0.5" role="group" aria-label="Preferensi Kurir">
        <button
          type="button"
          data-testid="courier-chip-auto"
          class="px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer flex items-center gap-1.5"
          :class="[
            selectedCourier === null || selectedCourier === ''
              ? 'border-brand-ink bg-brand-ink text-white font-medium shadow-2xs'
              : 'border-brand-hair hover:border-brand-ink/40 text-brand-muted bg-white',
          ]"
          :disabled="disabled"
          @click="selectCourier(null)"
        >
          <i
            v-if="selectedCourier === null || selectedCourier === ''"
            class="pi pi-check text-[10px]"
          />
          Rekomendasi ShelfStack (Otomatis)
        </button>
        <button
          v-for="c in supportedCouriers"
          :key="c.code"
          type="button"
          :data-testid="`courier-chip-${c.code}`"
          class="px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer flex items-center gap-1.5"
          :class="[
            selectedCourier === c.code
              ? 'border-brand-ink bg-brand-ink text-white font-medium shadow-2xs'
              : 'border-brand-hair hover:border-brand-ink/40 text-brand-muted bg-white',
          ]"
          :disabled="disabled"
          @click="selectCourier(c.code)"
        >
          <i v-if="selectedCourier === c.code" class="pi pi-check text-[10px]" />
          {{ c.name.replace(' Express', '').replace(' Ekspres', '') }}
        </button>
      </div>
    </div>
  </div>
</template>
