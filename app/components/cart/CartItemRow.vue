<script setup lang="ts">
import type { CartItem } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  updateQty: [item: CartItem, qty: number]
  remove: [item: CartItem]
}>()

const handleManualQuantityInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  target.value = sanitized
  if (!sanitized) return
  const val = parseInt(sanitized, 10)
  const targetQty = val > props.item.stock ? props.item.stock : val >= 1 ? val : 1
  target.value = String(targetQty)
  emit('updateQty', props.item, targetQty)
}

const handleManualQuantityBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  const targetQty =
    !target.value || isNaN(val) || val < 1 ? 1 : val > props.item.stock ? props.item.stock : val
  target.value = String(targetQty)
  emit('updateQty', props.item, targetQty)
}
</script>

<template>
  <li class="cart-row-host">
    <article
      class="cart-row transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-canvas-soft/60"
    >
      <NuxtLink
        :to="`/product/${item.slug || item.productId}`"
        class="cart-media block rounded-media bg-brand-canvas-soft border border-brand-hairsoft overflow-hidden shrink-0 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
      >
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name"
          width="72"
          height="72"
          decoding="async"
          class="w-full h-full object-cover"
          :class="item.stock <= 0 ? 'opacity-45 grayscale' : ''"
        />
        <div
          v-else
          class="flex items-center justify-center w-full h-full text-brand-faint"
          aria-hidden="true"
        >
          <i class="pi pi-image text-base opacity-50" />
        </div>
      </NuxtLink>

      <div class="cart-info min-w-0">
        <h2
          class="m-0 font-display text-[13px] sm:text-sm font-semibold leading-snug tracking-[-0.01em] [text-wrap:balance]"
        >
          <NuxtLink
            :to="`/product/${item.slug || item.productId}`"
            class="text-brand-ink hover:text-brand-accent transition-colors no-underline line-clamp-2 sm:line-clamp-1 break-words focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 rounded-sm"
          >
            {{ item.name }}
          </NuxtLink>
        </h2>

        <div
          class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-brand-muted"
        >
          <span
            v-if="item.stock <= 0"
            class="inline-flex items-center rounded-md bg-brand-danger-tint border border-brand-danger-edge px-1.5 py-0.5 text-[10px] font-semibold leading-none text-brand-danger-text"
          >
            Stok Habis
          </span>
          <span v-if="item.color || item.material" class="truncate max-w-[12rem]">
            <template v-if="item.color">{{ item.color }}</template>
            <template v-if="item.color && item.material"> / </template>
            <template v-if="item.material">{{ item.material }}</template>
          </span>
          <span v-if="item.quantity > 1" class="tabular-nums">
            {{ formatRupiah(item.price) }} / unit
          </span>
        </div>
      </div>

      <div class="cart-bottom flex items-center justify-between gap-3">
        <div
          class="inline-flex items-center border border-brand-hair rounded-full bg-brand-canvas h-8 px-1"
        >
          <button
            type="button"
            class="cart-step-btn relative w-6 h-6 flex items-center justify-center text-brand-ink hover:bg-brand-field rounded-full transition-colors cursor-pointer text-xs focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
            :aria-label="`Kurangi kuantitas ${item.name}`"
            @click="emit('updateQty', item, item.quantity - 1)"
          >
            <i class="pi pi-minus text-[10px]" aria-hidden="true" />
          </button>
          <input
            :value="item.quantity"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            :aria-label="`Kuantitas ${item.name}`"
            class="w-9 text-center text-xs font-semibold text-brand-ink bg-transparent border-0 tabular-nums focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 rounded-full p-0 select-all"
            @focus="($event.target as HTMLInputElement).select()"
            @input="handleManualQuantityInput"
            @blur="handleManualQuantityBlur"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <button
            type="button"
            class="cart-step-btn relative w-6 h-6 flex items-center justify-center text-brand-ink hover:bg-brand-field rounded-full transition-colors cursor-pointer text-xs disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
            :disabled="item.stock <= 0 || item.quantity >= item.stock"
            :aria-label="`Tambah kuantitas ${item.name}`"
            @click="emit('updateQty', item, item.quantity + 1)"
          >
            <i class="pi pi-plus text-[10px]" aria-hidden="true" />
          </button>
        </div>

        <span
          class="cart-subtotal font-display text-sm sm:text-[15px] font-bold text-brand-ink tabular-nums whitespace-nowrap"
        >
          {{ formatRupiah(item.price * item.quantity) }}
        </span>
      </div>

      <div class="cart-remove-slot">
        <button
          type="button"
          :aria-label="`Hapus ${item.name} dari keranjang`"
          :title="`Hapus ${item.name} dari keranjang`"
          class="cart-remove-btn relative inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-brand-muted transition-colors duration-150 hover:border-brand-danger-edge hover:bg-brand-danger-tint hover:text-brand-danger-text focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 cursor-pointer"
          @click="emit('remove', item)"
        >
          <i class="pi pi-trash text-xs" aria-hidden="true" />
        </button>
      </div>
    </article>
  </li>
</template>

<style scoped>
.cart-row-host {
  container-type: inline-size;
}

.cart-row {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  grid-template-areas:
    'media info remove'
    'media bottom bottom';
  gap: 0.5rem 0.75rem;
  align-items: start;
  padding: 0.75rem;
}

.cart-media {
  grid-area: media;
  width: 4rem;
  height: 4rem;
}

.cart-info {
  grid-area: info;
}

.cart-bottom {
  grid-area: bottom;
}

.cart-remove-slot {
  grid-area: remove;
}

.cart-step-btn,
.cart-remove-btn {
  touch-action: manipulation;
}

@media (pointer: coarse) {
  .cart-step-btn::after,
  .cart-remove-btn::after {
    content: '';
    position: absolute;
    inset: -8px;
  }
}

@container (min-width: 34rem) {
  .cart-row {
    grid-template-columns: 4.5rem minmax(0, 1fr) auto auto;
    grid-template-areas: 'media info bottom remove';
    gap: 0.75rem 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .cart-media {
    width: 4.5rem;
    height: 4.5rem;
  }

  .cart-bottom {
    gap: 1.25rem;
  }

  .cart-subtotal {
    min-inline-size: 6.5rem;
    text-align: right;
  }
}
</style>
