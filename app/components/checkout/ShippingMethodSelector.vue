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

    <!-- Service Options Radio Group -->
    <div
      role="radiogroup"
      aria-label="Pilihan Layanan Pengiriman"
      class="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div
        v-for="(svc, index) in servicesWithPricing"
        :key="svc.key"
        role="radio"
        :aria-checked="modelValue === svc.key"
        :tabindex="modelValue === svc.key ? 0 : -1"
        :data-testid="`shipping-option-${svc.key}`"
        class="relative flex flex-col justify-between p-4 rounded-card border transition-all duration-200 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
        :class="[
          modelValue === svc.key
            ? 'border-brand-ink ring-2 ring-brand-ink/10 bg-brand-canvas-soft/30'
            : 'border-brand-hair hover:border-brand-ink/40 bg-white',
        ]"
        @click="selectService(svc.key)"
        @keydown="handleKeydown($event, index)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <!-- Custom Radio Circle Indicator -->
            <div
              class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors"
              :class="[
                modelValue === svc.key
                  ? 'border-brand-ink bg-brand-ink'
                  : 'border-brand-hair bg-white',
              ]"
            >
              <div v-if="modelValue === svc.key" class="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div>
              <p class="font-display font-bold text-xs sm:text-sm text-brand-ink m-0 leading-tight">
                {{ svc.name }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5">Estimasi {{ svc.eta }}</p>
            </div>
          </div>

          <!-- Price or Free Badge -->
          <div class="shrink-0 text-right">
            <template v-if="svc.isFree">
              <UiBadge label="Bebas Ongkir" variant="success" class="text-[10px]" />
            </template>
            <template v-else>
              <span class="font-display font-bold text-xs sm:text-sm text-brand-ink tabular-nums">
                {{ svc.formattedPrice }}
              </span>
            </template>
          </div>
        </div>

        <p
          class="text-[11px] text-brand-muted m-0 mt-3 pt-2.5 border-t border-brand-hairsoft leading-relaxed"
        >
          {{ svc.description }}
        </p>
      </div>
    </div>

    <!-- Preferred Courier Pills -->
    <div class="pt-2 border-t border-brand-hairsoft space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="block text-xs font-semibold text-brand-ink"> Preferensi Mitra Kurir </label>
        <span class="text-[11px] text-brand-muted">Opsional</span>
      </div>

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Preferensi Kurir">
        <button
          type="button"
          data-testid="courier-chip-auto"
          class="px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer"
          :class="[
            selectedCourier === null || selectedCourier === ''
              ? 'border-brand-ink bg-brand-ink text-white font-medium shadow-2xs'
              : 'border-brand-hair hover:border-brand-ink/40 text-brand-muted bg-white',
          ]"
          :disabled="disabled"
          @click="selectCourier(null)"
        >
          Rekomendasi ShelfStack (Otomatis)
        </button>
        <button
          v-for="c in supportedCouriers"
          :key="c.code"
          type="button"
          :data-testid="`courier-chip-${c.code}`"
          class="px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer"
          :class="[
            selectedCourier === c.code
              ? 'border-brand-ink bg-brand-ink text-white font-medium shadow-2xs'
              : 'border-brand-hair hover:border-brand-ink/40 text-brand-muted bg-white',
          ]"
          :disabled="disabled"
          @click="selectCourier(c.code)"
        >
          {{ c.name.replace(' Express', '').replace(' Ekspres', '') }}
        </button>
      </div>
    </div>
  </div>
</template>
