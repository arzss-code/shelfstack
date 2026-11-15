<script setup lang="ts">
import { type CartItem, useCartStore } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'

defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  navigateProduct: [item: CartItem]
}>()

const cartStore = useCartStore()

const handleManualQuantityInput = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  target.value = sanitized
  if (!sanitized) return
  const val = parseInt(sanitized, 10)
  if (val > item.stock) {
    target.value = String(item.stock)
    cartStore.updateQuantity(item.productId, item.stock, item.color, item.material)
  } else if (val >= 1) {
    cartStore.updateQuantity(item.productId, val, item.color, item.material)
  }
}

const handleManualQuantityBlur = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (!target.value || isNaN(val) || val < 1) {
    target.value = '1'
    cartStore.updateQuantity(item.productId, 1, item.color, item.material)
  } else if (val > item.stock) {
    target.value = String(item.stock)
    cartStore.updateQuantity(item.productId, item.stock, item.color, item.material)
  } else {
    target.value = String(val)
    cartStore.updateQuantity(item.productId, val, item.color, item.material)
  }
}
</script>

<template>
  <article class="py-3.5 first:pt-0 last:pb-0 flex gap-3.5 items-start group">
    <!-- Thumbnail -->
    <div
      class="w-16 h-16 rounded-card bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
      @click="emit('navigateProduct', item)"
    >
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.name"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <i v-else class="pi pi-image text-brand-faint text-lg" />
    </div>

    <!-- Info & Actions -->
    <div class="flex-1 min-w-0 flex flex-col justify-between min-h-[64px]">
      <div>
        <h3
          class="font-display font-medium text-xs sm:text-sm text-brand-ink line-clamp-1 m-0 hover:text-brand-accent cursor-pointer transition-colors leading-snug"
          :title="item.name"
          @click="emit('navigateProduct', item)"
        >
          {{ item.name }}
        </h3>

        <!-- Variant Pill & Out of Stock Badge -->
        <div
          v-if="item.color || item.material || item.stock <= 0"
          class="flex items-center gap-1.5 mt-0.5 flex-wrap"
        >
          <span
            v-if="item.color || item.material"
            class="inline-flex items-center rounded bg-brand-canvas-soft border border-brand-hairsoft px-1.5 py-0.5 text-[10px] text-brand-muted font-medium"
          >
            <span v-if="item.color">{{ item.color }}</span>
            <span v-if="item.color && item.material"> · </span>
            <span v-if="item.material">{{ item.material }}</span>
          </span>
          <span
            v-if="item.stock <= 0"
            class="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] text-red-700 font-bold"
          >
            <i class="pi pi-times-circle text-[9px]" /> Stok Habis
          </span>
        </div>
      </div>

      <!-- Bottom Row: Price on Left, Actions (Trash + Stepper) on Right -->
      <div class="flex items-end justify-between pt-2 gap-2">
        <!-- Price -->
        <div class="min-w-0">
          <span
            class="font-display text-xs sm:text-[13px] font-bold text-brand-ink tabular-nums block leading-tight"
          >
            {{ formatRupiah(item.price * item.quantity) }}
          </span>
          <span
            v-if="item.quantity > 1"
            class="text-[10px] text-brand-muted tabular-nums block font-normal mt-0.5"
          >
            @ {{ formatRupiah(item.price) }}
          </span>
        </div>

        <!-- Actions: Trash Button + Stepper -->
        <div class="flex items-center gap-1.5 shrink-0">
          <UiTooltip text="Hapus item" position="top">
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-brand-faint hover:text-brand-danger hover:bg-brand-danger-tint transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Hapus item"
              @click="cartStore.removeItem(item.productId, item.color, item.material)"
            >
              <i class="pi pi-trash text-xs" />
            </button>
          </UiTooltip>

          <!-- Stepper -->
          <div
            class="flex items-center border border-brand-hair rounded-full bg-brand-field h-7 px-1 gap-0.5"
          >
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center text-brand-ink hover:bg-brand-canvas rounded-full transition-colors cursor-pointer text-xs border-0 bg-transparent"
              aria-label="Kurangi kuantitas"
              @click="
                cartStore.updateQuantity(
                  item.productId,
                  item.quantity - 1,
                  item.color,
                  item.material,
                )
              "
            >
              <i class="pi pi-minus text-[8px]" />
            </button>
            <input
              :value="item.quantity"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              aria-label="Kuantitas item"
              class="w-7 text-center text-xs font-bold text-brand-ink bg-transparent border-0 outline-none tabular-nums focus:bg-brand-canvas rounded transition-colors p-0 select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @focus="($event.target as HTMLInputElement).select()"
              @input="handleManualQuantityInput($event, item)"
              @blur="handleManualQuantityBlur($event, item)"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
            />
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center text-brand-ink hover:bg-brand-canvas rounded-full transition-colors cursor-pointer text-xs disabled:opacity-30 disabled:cursor-not-allowed border-0 bg-transparent"
              :disabled="item.stock <= 0 || item.quantity >= item.stock"
              aria-label="Tambah kuantitas"
              @click="
                cartStore.updateQuantity(
                  item.productId,
                  item.quantity + 1,
                  item.color,
                  item.material,
                )
              "
            >
              <i class="pi pi-plus text-[8px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
