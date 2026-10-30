<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { getProductVariants } from '~/utils/product-specs'
import WishlistButton from '~/components/wishlist/WishlistButton.vue'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  addToBag: [payload: { quantity: number; color: string; material: string }]
  buyNow: [payload: { quantity: number; color: string; material: string }]
}>()

const variants = computed(() => getProductVariants(props.product))

const quantity = ref(1)
const selectedColor = ref('')
const selectedMaterial = ref('')

// Sinkronkan pilihan default saat produk dimuat atau berubah
watch(
  () => props.product,
  () => {
    const firstColor = variants.value.colors[0]
    if (firstColor) selectedColor.value = firstColor.name
    const firstOption = variants.value.options[0]
    if (firstOption) selectedMaterial.value = firstOption.name
  },
  { immediate: true },
)

const ratingValue = computed(() => {
  const r = props.product.rating
  return r && Number(r) > 0 ? Number(r) : null
})
const reviewCountValue = computed(() => props.product.review_count ?? null)

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
        <span class="text-xs text-brand-muted">
          {{ product.sku ? `SKU: ${product.sku}` : `SKU: SS-MOD-0${product.id}` }}
        </span>
      </div>

      <h1
        class="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-ink leading-tight m-0 mb-3"
      >
        {{ product.name }}
      </h1>

      <!-- Reviews Social Proof with Smooth Anchor Link -->
      <a
        v-if="ratingValue"
        href="#reviews"
        class="inline-flex items-center gap-3 text-xs text-brand-muted cursor-pointer hover:opacity-80 transition-opacity no-underline"
      >
        <div
          class="inline-flex items-center gap-1 bg-brand-canvas-soft border border-brand-hair px-2.5 py-1 rounded-full"
        >
          <div class="flex text-brand-warning">
            <i class="pi pi-star-fill text-[11px]" />
          </div>
          <span class="font-bold text-brand-ink ml-1">{{ ratingValue.toFixed(1) }}</span>
        </div>
        <span v-if="reviewCountValue">{{ reviewCountValue }} ulasan</span>
      </a>
      <a
        v-else
        href="#reviews"
        class="inline-flex items-center gap-2 text-xs text-brand-muted cursor-pointer hover:opacity-80 transition-opacity no-underline"
      >
        <i class="pi pi-verified text-brand-success text-xs" />
        <span class="font-medium text-brand-ink">Kurasi Fisik Terjamin</span>
        <span class="text-brand-faint">·</span>
        <span>ShelfStack Official</span>
      </a>
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
        <span class="uppercase tracking-wider font-semibold text-brand-muted">{{
          variants.colorTitle
        }}</span>
        <span class="font-bold text-brand-ink">{{ selectedColor }}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <UiTooltip v-for="c in variants.colors" :key="c.name" :text="c.name" position="top">
          <button
            type="button"
            :aria-label="c.name"
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
        </UiTooltip>
      </div>
    </div>

    <!-- Configurator 2: Material / Secondary Options -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="uppercase tracking-wider font-semibold text-brand-muted">{{
          variants.optionTitle
        }}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          v-for="opt in variants.options"
          :key="opt.name"
          type="button"
          :class="[
            'p-3 rounded-field text-left border transition-all cursor-pointer flex flex-col justify-between gap-1',
            selectedMaterial === opt.name
              ? 'bg-brand-ink text-brand-onink border-brand-ink shadow-whisper'
              : 'bg-brand-canvas border-brand-hair text-brand-ink hover:bg-brand-canvas-soft',
          ]"
          @click="selectedMaterial = opt.name"
        >
          <span class="text-xs font-bold">{{ opt.name }}</span>
          <span
            v-if="opt.note"
            :class="selectedMaterial === opt.name ? 'text-brand-muted' : 'text-brand-faint'"
            class="text-[10px]"
          >
            {{ opt.note }}
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
            class="w-12 text-center font-display font-bold text-sm text-brand-ink bg-transparent border-0 outline-none tabular-nums focus:bg-brand-canvas focus:ring-1 focus:ring-brand-accent/40 rounded-sm transition-all py-1 select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          <span v-else> Tambah ke Bag · {{ formatRupiah(product.price * quantity) }} </span>
        </UiButton>

        <!-- Wishlist Action Button -->
        <WishlistButton :product="product" variant="inline" class="shrink-0" />
      </div>

      <!-- Instant 1-Click Buy Action using UiButton -->
      <UiButton
        variant="outline"
        block
        :disabled="isOutOfStock"
        icon="pi-bolt"
        @click="handleBuyNow"
      >
        Pesan Cepat 1-Klik
      </UiButton>
    </div>

    <!-- Fulfillment & Dispatch Assurance Strip -->
    <div
      class="pt-4 border-t border-brand-hairsoft flex items-center justify-between text-xs text-brand-muted"
    >
      <div class="flex items-center gap-1.5">
        <i class="pi pi-truck text-brand-ink text-xs" />
        <span>Gudang Jakarta</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="pi pi-shield text-brand-success text-xs" />
        <span>Garansi Toko Resmi</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="pi pi-lock text-brand-ink text-xs" />
        <span>Midtrans Terenkripsi</span>
      </div>
    </div>
  </div>
</template>
