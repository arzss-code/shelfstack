<script setup lang="ts">
const props = defineProps<{
  minPrice?: number
  maxPrice?: number
  selectedChip?: string
}>()

const emit = defineEmits<{
  applyRange: [min?: number, max?: number, chipId?: string]
  clearRange: []
}>()

const localMin = ref<string>(props.minPrice ? String(props.minPrice) : '')
const localMax = ref<string>(props.maxPrice ? String(props.maxPrice) : '')
const validationError = ref<string | null>(null)

watch(
  () => [props.minPrice, props.maxPrice],
  ([newMin, newMax]) => {
    localMin.value = newMin !== undefined ? String(newMin) : ''
    localMax.value = newMax !== undefined ? String(newMax) : ''
    validationError.value = null
  },
)

const quickChips = [
  { id: 'all', label: 'Semua', min: undefined, max: undefined },
  { id: 'under250k', label: '< Rp 250rb', min: undefined, max: 250000 },
  { id: '250k-1m', label: 'Rp 250rb - 1jt', min: 250000, max: 1000000 },
  { id: 'above1m', label: '> Rp 1jt', min: 1000000, max: undefined },
]

function handleSelectChip(chip: (typeof quickChips)[number]) {
  validationError.value = null
  if (chip.id === 'all') {
    localMin.value = ''
    localMax.value = ''
    emit('clearRange')
    return
  }

  localMin.value = chip.min !== undefined ? String(chip.min) : ''
  localMax.value = chip.max !== undefined ? String(chip.max) : ''
  emit('applyRange', chip.min, chip.max, chip.id)
}

function handleApplyCustom() {
  validationError.value = null
  const parsedMin = localMin.value ? parseInt(localMin.value, 10) : undefined
  const parsedMax = localMax.value ? parseInt(localMax.value, 10) : undefined

  if (parsedMin !== undefined && isNaN(parsedMin)) {
    validationError.value = 'Harga minimum harus berupa angka.'
    return
  }
  if (parsedMax !== undefined && isNaN(parsedMax)) {
    validationError.value = 'Harga maksimum harus berupa angka.'
    return
  }
  if (parsedMin !== undefined && parsedMin < 0) {
    validationError.value = 'Harga minimum tidak boleh negatif.'
    return
  }
  if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
    validationError.value = 'Harga minimum tidak boleh lebih besar dari maksimum.'
    return
  }

  if (parsedMin === undefined && parsedMax === undefined) {
    emit('clearRange')
    return
  }

  emit('applyRange', parsedMin, parsedMax, 'custom')
}
</script>

<template>
  <div class="space-y-3">
    <!-- Quick Chips -->
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="chip in quickChips"
        :key="chip.id"
        type="button"
        class="px-2 py-1.5 rounded-field text-xs font-medium border text-center transition-colors cursor-pointer truncate"
        :class="
          selectedChip === chip.id
            ? 'bg-brand-ink text-white border-brand-ink font-semibold shadow-whisper'
            : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink hover:border-brand-ink'
        "
        @click="handleSelectChip(chip)"
      >
        {{ chip.label }}
      </button>
    </div>

    <!-- Custom Min-Max Inputs -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <span
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-brand-muted"
          >
            Rp
          </span>
          <input
            v-model="localMin"
            type="number"
            min="0"
            step="10000"
            placeholder="Min"
            aria-label="Harga minimum"
            class="w-full pl-8 pr-2 py-1.5 bg-brand-canvas-soft border border-brand-hair rounded-field text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-brand-canvas focus:outline-none transition-colors tabular"
            @keydown.enter.prevent="handleApplyCustom"
          />
        </div>
        <span class="text-xs text-brand-muted shrink-0">-</span>
        <div class="relative flex-1">
          <span
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-brand-muted"
          >
            Rp
          </span>
          <input
            v-model="localMax"
            type="number"
            min="0"
            step="10000"
            placeholder="Maks"
            aria-label="Harga maksimum"
            class="w-full pl-8 pr-2 py-1.5 bg-brand-canvas-soft border border-brand-hair rounded-field text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-brand-canvas focus:outline-none transition-colors tabular"
            @keydown.enter.prevent="handleApplyCustom"
          />
        </div>
      </div>

      <p v-if="validationError" class="text-[11px] text-brand-danger font-medium m-0">
        {{ validationError }}
      </p>

      <div class="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          class="flex-1 py-1.5 px-3 rounded-field bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer shadow-whisper"
          @click="handleApplyCustom"
        >
          Terapkan
        </button>
        <button
          v-if="localMin || localMax || (selectedChip && selectedChip !== 'all')"
          type="button"
          class="py-1.5 px-2.5 rounded-field border border-brand-hair text-xs font-medium text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          @click="emit('clearRange')"
        >
          Hapus
        </button>
      </div>
    </div>
  </div>
</template>
