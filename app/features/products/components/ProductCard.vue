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
    class="product-card group relative flex flex-col bg-brand-canvas border border-brand-hairsoft/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-brand-hair hover:shadow-floating cursor-pointer"
    @click="navigateToDetail"
  >
    <!-- Stretched Semantic Link for Accessibility, Hover URL & SEO -->
    <NuxtLink
      :to="`/product/${product.slug || product.id}`"
      class="absolute inset-0 z-0"
      :aria-label="product.name"
      tabindex="-1"
    />

    <!-- Compact Media Canvas (1:1 Aspect Ratio) -->
    <div
      class="relative aspect-square w-full bg-[#f6f6f7] dark:bg-[#18191b] overflow-hidden flex items-center justify-center pointer-events-none"
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
        class="flex flex-col items-center justify-center w-full h-full text-brand-faint gap-1"
      >
        <i class="pi pi-image text-2xl opacity-30" />
        <span class="text-[10px] font-medium tracking-widest uppercase opacity-50">ShelfStack</span>
      </div>

      <!-- Urgent Stock Status Tag (Minimalist & Unobtrusive) -->
      <div v-if="product.stock === 0" class="absolute top-2.5 left-2.5 z-10 pointer-events-none">
        <span
          class="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-brand-ink/90 text-brand-onink backdrop-blur-sm"
        >
          Habis
        </span>
      </div>
      <div
        v-else-if="product.stock > 0 && product.stock <= 3"
        class="absolute top-2.5 left-2.5 z-10 pointer-events-none"
      >
        <span
          class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25 backdrop-blur-sm"
        >
          Sisa {{ product.stock }}
        </span>
      </div>

      <!-- Floating Quick Add Button (Desktop Hover) -->
      <button
        v-if="hideActions && product.stock > 0"
        type="button"
        class="absolute bottom-2.5 right-2.5 z-10 pointer-events-auto w-8 h-8 rounded-full bg-brand-canvas/90 hover:bg-brand-ink hover:text-brand-onink text-brand-ink shadow-whisper border border-brand-hair/80 flex items-center justify-center opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-sm"
        :title="`Tambah ${product.name} ke Keranjang`"
        :aria-label="`Tambah ${product.name} ke Keranjang`"
        @click.stop.prevent="handleQuickAdd"
      >
        <i v-if="justAdded" class="pi pi-check text-[11px] text-brand-success" />
        <i v-else class="pi pi-plus text-[11px]" />
      </button>
    </div>

    <!-- Compact Content Body (Zero Redundancy) -->
    <div
      class="p-3 sm:p-3.5 flex flex-col justify-between gap-2 flex-1 relative z-10 pointer-events-none"
    >
      <div class="space-y-0.5">
        <!-- Title: 1 line, editorial weight -->
        <h3
          class="font-display font-medium text-sm sm:text-[14.5px] text-brand-ink tracking-tight truncate group-hover:text-brand-accent transition-colors m-0"
          :title="product.name"
        >
          {{ product.name }}
        </h3>

        <!-- Subtle Micro Meta: Category or SKU without redundant text -->
        <p class="font-body m-0 text-[11px] text-brand-muted tracking-tight truncate">
          {{ categoryName || product.sku || 'Koleksi Esensial' }}
        </p>
      </div>

      <!-- Bottom Row: Clean Price + Action -->
      <div
        class="flex items-center justify-between gap-2 pt-2 border-t border-brand-hairsoft/80 pointer-events-auto"
        @click.stop
      >
        <span
          class="font-display font-semibold text-sm sm:text-[15px] text-brand-ink tabular-nums tracking-tight"
        >
          {{ formatRupiah(product.price) }}
        </span>

        <!-- Mobile Quick Add -->
        <div v-if="hideActions">
          <button
            v-if="product.stock > 0"
            type="button"
            class="sm:hidden w-7 h-7 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair flex items-center justify-center active:scale-95 cursor-pointer"
            :title="`Tambah ${product.name} ke Keranjang`"
            @click.stop.prevent="handleQuickAdd"
          >
            <i v-if="justAdded" class="pi pi-check text-[10px] text-brand-success" />
            <i v-else class="pi pi-plus text-[10px]" />
          </button>
        </div>

        <!-- Admin Actions (Management Mode) -->
        <div v-else class="flex items-center gap-1">
          <template v-if="isTrash">
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair transition-colors"
              @click.stop="emit('restore', product.id)"
            >
              Restore
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="w-7 h-7 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-muted transition-colors flex items-center justify-center cursor-pointer border border-brand-hair"
              title="Ubah"
              @click.stop="emit('edit', product)"
            >
              <i class="pi pi-pencil text-[10px]" />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-full bg-brand-canvas-soft hover:bg-red-600 hover:text-white text-brand-muted transition-colors flex items-center justify-center cursor-pointer border border-brand-hair"
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
