<script setup lang="ts">
import type { Product } from '~/types/product'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'

const props = withDefaults(
  defineProps<{
    product: Product
    categoryName?: string | null
    variant?: 'overlay' | 'inline' | 'button'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    categoryName: null,
    variant: 'overlay',
    size: 'md',
  },
)

const wishlistStore = useWishlistStore()
const toast = useUiToast()
const isPopping = ref(false)

const isSaved = computed(() => wishlistStore.isInWishlist(props.product.id))

const handleToggle = (e: Event) => {
  e.stopPropagation()
  e.preventDefault()

  const added = wishlistStore.toggleWishlist(props.product, props.categoryName)
  isPopping.value = true
  setTimeout(() => {
    isPopping.value = false
  }, 400)

  if (added) {
    toast.add({
      severity: 'success',
      summary: 'Wishlist',
      detail: `${props.product.name} disimpan ke wishlist.`,
      life: 2000,
    })
  } else {
    toast.add({
      severity: 'info',
      summary: 'Wishlist',
      detail: `${props.product.name} dihapus dari wishlist.`,
      life: 2000,
    })
  }
}
</script>

<template>
  <!-- Variant 1: Overlay Circular Button on Product Cards -->
  <UiTooltip
    v-if="variant === 'overlay'"
    :text="isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'"
    position="bottom"
    align="end"
  >
    <button
      type="button"
      :aria-label="
        isSaved ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name} ke wishlist`
      "
      class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-colors duration-150 select-none"
      :class="[
        isSaved
          ? 'bg-brand-danger-tint text-brand-danger hover:opacity-90'
          : 'bg-brand-canvas text-brand-muted hover:text-brand-danger hover:bg-brand-canvas-soft',
      ]"
      @click="handleToggle"
    >
      <i
        class="text-xs transition-colors duration-150"
        :class="[
          isSaved ? 'pi pi-heart-fill' : 'pi pi-heart',
          isPopping ? 'animate-heart-pop' : '',
        ]"
      />
    </button>
  </UiTooltip>

  <!-- Variant 2: Full Width Secondary Button (e.g. In Product Detail) -->
  <button
    v-else-if="variant === 'button'"
    type="button"
    :aria-label="isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'"
    class="w-full py-2.5 px-4 rounded-full border transition-all duration-200 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.98]"
    :class="[
      isSaved
        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
        : 'bg-brand-canvas border-brand-ink/15 text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/30',
    ]"
    @click="handleToggle"
  >
    <i
      class="text-sm transition-colors duration-200"
      :class="[
        isSaved ? 'pi pi-heart-fill text-rose-600' : 'pi pi-heart text-brand-muted',
        isPopping ? 'animate-heart-pop' : '',
      ]"
    />
    <span>{{ isSaved ? 'Tersimpan di Wishlist' : 'Simpan ke Wishlist' }}</span>
  </button>

  <!-- Variant 3: Inline Icon Only Button -->
  <UiTooltip
    v-else
    :text="isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'"
    position="bottom"
    class="shrink-0"
  >
    <button
      type="button"
      :aria-label="isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'"
      class="rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 shrink-0"
      :class="[
        size === 'lg'
          ? 'w-12 h-12 min-w-[48px] min-h-[48px]'
          : 'w-10 h-10 min-w-[40px] min-h-[40px]',
        isSaved
          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
          : 'bg-brand-canvas border-brand-ink/15 text-brand-muted hover:text-rose-600 hover:bg-brand-canvas-soft hover:border-brand-ink/30',
      ]"
      @click="handleToggle"
    >
      <i
        class="transition-colors duration-200"
        :class="[
          size === 'lg' ? 'text-lg' : 'text-base',
          isSaved ? 'pi pi-heart-fill text-brand-danger' : 'pi pi-heart',
          isPopping ? 'animate-heart-pop' : '',
        ]"
      />
    </button>
  </UiTooltip>
</template>

<style scoped>
@keyframes heartPop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.14);
  }
  100% {
    transform: scale(1);
  }
}

.animate-heart-pop {
  animation: heartPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-block;
  transform-origin: center;
}
</style>
