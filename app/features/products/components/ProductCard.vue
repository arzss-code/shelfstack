<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useCategories } from '~/composables/useCategories'
import { useCartStore } from '~/features/cart/stores/cart'
import { useToast } from 'primevue/usetoast'

const props = withDefaults(
  defineProps<{
    product: Product
    hideActions?: boolean
    isTrash?: boolean
  }>(),
  {
    hideActions: true,
    isTrash: false,
  },
)

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
}>()

const router = useRouter()
const toast = useToast()
const cartStore = useCartStore()
const { categories: dynamicCategories } = useCategories()

const justAdded = ref(false)

const categoryName = computed(() => {
  if (!props.product.category_id) return null
  const cat = dynamicCategories.value.find((c) => c.id === props.product.category_id)
  return cat ? cat.name : null
})

const formattedRating = computed(() => {
  const r = props.product.rating
  if (!r || Number(r) <= 0) return '5.0'
  return Number(r).toFixed(1)
})

const soldCountText = computed(() => {
  const count = props.product.sold_count ?? props.product.review_count ?? 0
  if (count <= 0) return 'Baru'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}rb+ terjual`
  return `${count} terjual`
})

const badgeInfo = computed(() => {
  if (props.product.stock === 0) {
    return { label: 'Habis' }
  }
  if (props.product.stock > 0 && props.product.stock <= 3) {
    return { label: `Sisa ${props.product.stock}` }
  }
  if (props.product.is_featured) {
    return { label: 'Unggulan' }
  }
  if ((props.product.sold_count ?? 0) >= 30) {
    return { label: 'Terlaris' }
  }
  return null
})

const navigateToDetail = () => {
  const target = props.product.slug || props.product.id
  router.push(`/product/${target}`)
}

const handleQuickAdd = () => {
  if (props.product.stock <= 0) return

  cartStore.addItem({
    productId: props.product.id,
    slug: props.product.slug,
    name: props.product.name,
    price: props.product.price,
    priceCents: props.product.price_cents ?? Math.round(props.product.price * 100),
    imageUrl: props.product.image_url,
    stock: props.product.stock,
    openCartDrawer: true,
  })

  justAdded.value = true
  setTimeout(() => {
    justAdded.value = false
  }, 1500)

  toast.add({
    severity: 'success',
    summary: 'Ditambahkan ke Keranjang',
    detail: `${props.product.name} masuk ke pesanan.`,
    life: 2500,
  })
}
</script>

<template>
  <article
    class="product-card group relative flex flex-col bg-white dark:bg-[#18191b] rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    @click="navigateToDetail"
  >
    <!-- Stretched Semantic Link for Accessibility, Hover URL & SEO -->
    <NuxtLink
      :to="`/product/${product.slug || product.id}`"
      class="absolute inset-0 z-0 rounded-2xl"
      :aria-label="product.name"
      tabindex="-1"
    />

    <!-- 3D Ribbon Badge: Solid Blue, Right-Curved, with Fold Effect Underneath -->
    <div v-if="badgeInfo" class="absolute top-3 -left-2 z-20 pointer-events-none">
      <div class="relative flex flex-col items-start">
        <span
          class="bg-blue-600 text-white text-[10.5px] font-bold tracking-wider uppercase pl-3 pr-3.5 py-1 rounded-r-full rounded-tl-md shadow-sm"
        >
          {{ badgeInfo.label }}
        </span>
        <!-- 3D Ribbon fold curve underneath left edge matching user reference -->
        <span class="w-2 h-2.5 bg-blue-900 rounded-bl-md" />
      </div>
    </div>

    <!-- Media Canvas: 1:1 Aspect Ratio with rounded-t-2xl -->
    <div
      class="relative aspect-square w-full bg-[#f6f6f8] dark:bg-[#1f2023] rounded-t-2xl overflow-hidden flex items-center justify-center pointer-events-none"
    >
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        loading="lazy"
        :class="[
          'w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105',
          product.stock === 0 ? 'opacity-60 grayscale' : '',
        ]"
      />
      <div
        v-else
        class="flex flex-col items-center justify-center w-full h-full text-slate-400 gap-1"
      >
        <i class="pi pi-image text-2xl opacity-30" />
        <span class="text-[10px] font-medium tracking-widest uppercase opacity-50">ShelfStack</span>
      </div>

      <!-- Floating Quick Add Button (Desktop Hover) -->
      <button
        v-if="hideActions && product.stock > 0"
        type="button"
        class="absolute bottom-2.5 right-2.5 z-10 pointer-events-auto w-7 h-7 rounded-full bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"
        :title="`Tambah ${product.name} ke Keranjang`"
        :aria-label="`Tambah ${product.name} ke Keranjang`"
        @click.stop.prevent="handleQuickAdd"
      >
        <i v-if="justAdded" class="pi pi-check text-[10px] text-emerald-500" />
        <i v-else class="pi pi-plus text-[10px]" />
      </button>
    </div>

    <!-- Compact Content Body: Zero divider lines, small crisp typography -->
    <div
      class="p-3 sm:p-3.5 flex flex-col justify-between gap-2 flex-1 relative z-10 pointer-events-none"
    >
      <div class="space-y-1">
        <!-- Top Row: Category (Left) and Rating (Right) -->
        <div class="flex items-center justify-between gap-1.5 min-h-[16px]">
          <span
            v-if="categoryName"
            class="font-body text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider truncate"
          >
            {{ categoryName }}
          </span>
          <span v-else class="text-[10px] text-transparent select-none">-</span>

          <div
            v-if="product.rating && Number(product.rating) > 0"
            class="flex items-center gap-1 shrink-0 text-[11px] font-bold text-slate-700 dark:text-zinc-300 tabular-nums"
          >
            <i class="pi pi-star-fill text-amber-400 text-[10px]" />
            <span>{{ formattedRating }}</span>
          </div>
        </div>

        <!-- Product Title: Small, crisp font -->
        <h3
          class="font-display font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 tracking-tight line-clamp-2 group-hover:text-blue-600 transition-colors m-0 leading-snug"
          :title="product.name"
        >
          {{ product.name }}
        </h3>
      </div>

      <!-- Price & Terjual Row: Side-by-side, No Lines -->
      <div class="flex items-baseline justify-between gap-2 pt-0.5 pointer-events-auto" @click.stop>
        <!-- Price on Left -->
        <span
          class="font-display font-bold text-sm sm:text-[15px] text-slate-900 dark:text-white tabular-nums tracking-tight"
        >
          {{ formatRupiah(product.price) }}
        </span>

        <!-- Terjual on Right (Sejajar dengan harga) -->
        <span
          v-if="hideActions"
          class="text-[11px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums shrink-0"
        >
          {{ soldCountText }}
        </span>

        <!-- Admin Actions (Management Mode) -->
        <div v-else class="flex items-center gap-1">
          <template v-if="isTrash">
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 transition-colors"
              @click.stop="emit('restore', product.id)"
            >
              Restore
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
              title="Ubah"
              @click.stop="emit('edit', product)"
            >
              <i class="pi pi-pencil text-[10px]" />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
              title="Hapus"
              @click.stop="emit('delete', product.id)"
            >
              <i class="pi pi-trash text-[10px]" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
