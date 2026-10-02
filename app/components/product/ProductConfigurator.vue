<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  addToBag: [payload: { quantity: number; color: string; material: string }]
  buyNow: [payload: { quantity: number; color: string; material: string }]
}>()

const quantity = ref(1)
const selectedColor = ref('Matte Obsidian')
const selectedMaterial = ref('Anodized 6063 Alloy')

const colors = [
  { name: 'Matte Obsidian', class: 'bg-[#141414]' },
  { name: 'Silver Frost', class: 'bg-[#e2e2e2]' },
  { name: 'Space Gray', class: 'bg-[#525252]' },
]

const materials = [
  { name: 'Anodized 6063 Alloy', note: 'Standard Aerospace' },
  { name: 'Solid Walnut Wood', note: 'Hand-oiled finish' },
  { name: 'Merino Wool Felt', note: 'High acoustic absorption' },
]

const isOutOfStock = computed(() => props.product.stock === 0)
const maxQuantity = computed(() => Math.max(1, props.product.stock))

const incrementQty = () => {
  if (quantity.value < maxQuantity.value) {
    quantity.value++
  }
}

const decrementQty = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const handleQuantityInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  target.value = sanitized
  if (!sanitized) return
  const val = parseInt(sanitized, 10)
  if (val > maxQuantity.value) {
    quantity.value = maxQuantity.value
    target.value = String(maxQuantity.value)
  } else if (val >= 1) {
    quantity.value = val
  }
}

const handleQuantityBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (!target.value || isNaN(val) || val < 1) {
    quantity.value = 1
    target.value = '1'
  } else if (val > maxQuantity.value) {
    quantity.value = maxQuantity.value
    target.value = String(maxQuantity.value)
  } else {
    quantity.value = val
    target.value = String(val)
  }
}

const handleAddToBag = () => {
  if (isOutOfStock.value) return
  emit('addToBag', {
    quantity: quantity.value,
    color: selectedColor.value,
    material: selectedMaterial.value,
  })
}

const handleBuyNow = () => {
  if (isOutOfStock.value) return
  emit('buyNow', {
    quantity: quantity.value,
    color: selectedColor.value,
    material: selectedMaterial.value,
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Title, Stock & Rating -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <UiBadge v-if="isOutOfStock" label="Stok Habis" variant="danger" />
        <UiBadge
          v-else-if="product.stock < 5"
          :label="`Sisa ${product.stock} Unit`"
          variant="warning"
        />
        <UiBadge v-else label="Tersedia · Siap Kirim" variant="success" />
        <span class="text-xs text-brand-muted"> SKU: SS-MOD-0{{ product.id }} </span>
      </div>

      <h1
        class="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-ink leading-tight m-0 mb-3"
      >
        {{ product.name }}
      </h1>

      <!-- Reviews Social Proof -->
      <div class="flex items-center gap-3 text-xs text-brand-muted">
        <div
          class="inline-flex items-center gap-1 bg-brand-canvas-soft border border-brand-hair px-2.5 py-1 rounded-full"
        >
          <div class="flex text-brand-warning">
            <i class="pi pi-star-fill text-[11px]" />
            <i class="pi pi-star-fill text-[11px]" />
            <i class="pi pi-star-fill text-[11px]" />
            <i class="pi pi-star-fill text-[11px]" />
            <i class="pi pi-star-fill text-[11px]" />
          </div>
          <span class="font-bold text-brand-ink ml-1">4.94</span>
        </div>
        <span>486 ulasan terverifikasi</span>
      </div>
    </div>

    <!-- Pricing Container -->
    <UiCard :padded="true" class="space-y-2 bg-brand-canvas-soft">
      <div class="flex items-baseline gap-3">
        <span class="font-display text-3xl font-bold text-brand-ink tabular-nums">
          {{ formatRupiah(product.price) }}
        </span>
      </div>
      <p class="font-body text-xs text-brand-muted m-0">
        Pajak dan jaminan kurasi sudah termasuk. Pengiriman diproses langsung dari warehouse resmi.
      </p>
    </UiCard>

    <!-- Configurator 1: Colorways -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="uppercase tracking-wider font-semibold text-brand-muted"> Pilihan Warna </span>
        <span class="font-bold text-brand-ink">{{ selectedColor }}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <button
          v-for="c in colors"
          :key="c.name"
          type="button"
          :title="c.name"
          :class="[
            'w-9 h-9 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center',
            c.class,
            selectedColor === c.name
              ? 'border-brand-accent ring-2 ring-brand-accent/30 scale-105'
              : 'border-brand-hair hover:scale-105',
          ]"
          @click="selectedColor = c.name"
        >
          <i v-if="selectedColor === c.name" class="pi pi-check text-xs text-white" />
        </button>
      </div>
    </div>

    <!-- Configurator 2: Material Finish -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="uppercase tracking-wider font-semibold text-brand-muted">
          Pilihan Material
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          v-for="m in materials"
          :key="m.name"
          type="button"
          :class="[
            'p-3 rounded-field text-left border transition-all cursor-pointer flex flex-col justify-between gap-1',
            selectedMaterial === m.name
              ? 'bg-brand-ink text-brand-onink border-brand-ink shadow-whisper'
              : 'bg-brand-canvas border-brand-hair text-brand-ink hover:bg-brand-canvas-soft',
          ]"
          @click="selectedMaterial = m.name"
        >
          <span class="text-xs font-bold">{{ m.name }}</span>
          <span
            :class="selectedMaterial === m.name ? 'text-brand-muted' : 'text-brand-faint'"
            class="text-[10px]"
          >
            {{ m.note }}
          </span>
        </button>
      </div>
    </div>

    <!-- Quantity Stepper & Actions -->
    <div class="space-y-3 pt-2">
      <div class="flex items-center gap-3">
        <!-- Stepper Pill -->
        <div
          class="flex items-center bg-brand-field border border-brand-hair rounded-full p-1 shrink-0"
        >
          <button
            type="button"
            aria-label="Kurangi jumlah"
            :disabled="quantity <= 1 || isOutOfStock"
            class="w-8 h-8 rounded-full bg-brand-canvas text-brand-ink flex items-center justify-center hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0 disabled:opacity-40"
            @click="decrementQty"
          >
            <i class="pi pi-minus text-xs" />
          </button>
          <input
            :value="quantity"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            aria-label="Jumlah unit pesanan"
            :disabled="isOutOfStock"
            class="w-12 text-center font-display font-bold text-sm text-brand-ink bg-transparent border-0 outline-none tabular-nums focus:bg-white focus:ring-1 focus:ring-brand-accent/40 rounded-sm transition-all py-1 select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @focus="($event.target as HTMLInputElement).select()"
            @input="handleQuantityInput"
            @blur="handleQuantityBlur"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <button
            type="button"
            aria-label="Tambah jumlah"
            :disabled="quantity >= maxQuantity || isOutOfStock"
            class="w-8 h-8 rounded-full bg-brand-canvas text-brand-ink flex items-center justify-center hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0 disabled:opacity-40"
            @click="incrementQty"
          >
            <i class="pi pi-plus text-xs" />
          </button>
        </div>

        <!-- Add to Bag Button using UiButton -->
        <UiButton
          variant="primary"
          class="flex-1"
          :disabled="isOutOfStock"
          icon="pi-shopping-bag"
          @click="handleAddToBag"
        >
          <span v-if="isOutOfStock">Stok Habis</span>
          <span v-else> Tambah ke Bag — {{ formatRupiah(product.price * quantity) }} </span>
        </UiButton>
      </div>

      <!-- Instant 1-Click Buy Action using UiButton -->
      <UiButton
        variant="accent"
        block
        :disabled="isOutOfStock"
        icon="pi-bolt"
        @click="handleBuyNow"
      >
        Pesan Cepat 1-Klik
      </UiButton>
    </div>

    <!-- Reassurance Triad -->
    <div
      class="pt-4 border-t border-brand-hairsoft grid grid-cols-3 gap-2 text-center text-xs text-brand-muted"
    >
      <div>
        <span class="block font-bold text-brand-ink">Gratis Ongkir</span>
        <span class="text-[11px] text-brand-faint">Pesanan &gt; Rp 200rb</span>
      </div>
      <div>
        <span class="block font-bold text-brand-ink">30 Hari Garansi</span>
        <span class="text-[11px] text-brand-faint">Retur mudah tanpa ribet</span>
      </div>
      <div>
        <span class="block font-bold text-brand-ink">100% Original</span>
        <span class="text-[11px] text-brand-faint">Jaminan kurasi resmi</span>
      </div>
    </div>
  </div>
</template>
