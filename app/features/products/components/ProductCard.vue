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
  }, 1600)

  toast.add({
    severity: 'success',
    summary: 'Ditambahkan ke Keranjang',
    detail: `${props.product.name} berhasil ditambahkan.`,
    life: 2500,
  })
}
</script>

<template>
  <article
    class="product-card group relative flex flex-col bg-brand-canvas border border-brand-hairsoft rounded-card overflow-hidden transition-all duration-300 hover:border-brand-hair hover:shadow-floating cursor-pointer"
    @click="navigateToDetail"
  >
    <!-- Stretched Link for Semantic Accessibility, Hover URL Preview & SEO -->
    <NuxtLink
      :to="`/product/${product.slug || product.id}`"
      class="absolute inset-0 z-0"
      :aria-label="product.name"
      tabindex="-1"
    />

    <!-- Media Canvas: Clean Full-Bleed Framing -->
    <div
      class="relative aspect-[4/4.5] w-full bg-brand-canvas-soft dark:bg-brand-field/50 overflow-hidden flex items-center justify-center border-b border-brand-hairsoft/80 pointer-events-none"
    >
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        v-else
        class="flex flex-col items-center justify-center w-full h-full text-brand-faint gap-2"
      >
        <i class="pi pi-image text-3xl opacity-40" />
        <span class="text-[11px] font-medium tracking-wide uppercase opacity-60">ShelfStack</span>
      </div>

      <!-- Top Badges Overlay -->
      <div
        class="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-10"
      >
        <span
          v-if="product.stock === 0"
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-brand-ink/80 text-brand-onink backdrop-blur-md shadow-whisper"
        >
          Habis
        </span>
        <span
          v-else-if="product.stock > 0 && product.stock <= 3"
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 backdrop-blur-md shadow-whisper"
        >
          Sisa {{ product.stock }}
        </span>
        <span
          v-else-if="product.is_featured"
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-canvas/90 text-brand-accent border border-brand-accent/20 backdrop-blur-md shadow-whisper"
        >
          Unggulan
        </span>
      </div>

      <!-- Floating Quick Add Button on Hover (Desktop) -->
      <div
        v-if="hideActions && product.stock > 0"
        class="absolute bottom-3 right-3 z-10 pointer-events-auto opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
        @click.stop
      >
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-brand-ink text-brand-onink shadow-floating flex items-center justify-center hover:bg-brand-accent hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          :title="`Tambah ${product.name} ke Keranjang`"
          :aria-label="`Tambah ${product.name} ke Keranjang`"
          @click.stop="handleQuickAdd"
        >
          <i v-if="justAdded" class="pi pi-check text-xs text-white" />
          <i v-else class="pi pi-shopping-bag text-xs" />
        </button>
      </div>
    </div>

    <!-- Card Content Body -->
    <div
      class="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 relative z-10 pointer-events-none"
    >
      <div class="space-y-1.5">
        <!-- Category & Rating Row -->
        <div class="flex items-center justify-between gap-2 text-xs">
          <span
            v-if="categoryName"
            class="text-[11px] font-semibold tracking-wider uppercase text-brand-muted truncate"
          >
            {{ categoryName }}
          </span>
          <span
            v-else
            class="text-[11px] font-medium tracking-wider uppercase text-brand-muted font-mono"
          >
            {{ product.sku || `SHLF-${product.id}` }}
          </span>

          <!-- Rating -->
          <div
            v-if="product.rating && product.rating > 0"
            class="flex items-center gap-1 text-[11px] text-brand-muted shrink-0"
          >
            <i class="pi pi-star-fill text-amber-500 text-[10px]" />
            <span class="font-semibold text-brand-ink tabular-nums">{{
              product.rating.toFixed(1)
            }}</span>
            <span v-if="product.review_count" class="text-brand-faint text-[10px]">
              ({{ product.review_count }})
            </span>
          </div>
        </div>

        <!-- Product Name -->
        <h3
          class="font-display font-semibold text-base sm:text-[17px] text-brand-ink tracking-tight line-clamp-1 group-hover:text-brand-accent transition-colors m-0"
          :title="product.name"
        >
          <NuxtLink
            :to="`/product/${product.slug || product.id}`"
            class="text-inherit hover:text-brand-accent no-underline pointer-events-auto"
          >
            {{ product.name }}
          </NuxtLink>
        </h3>

        <!-- Short Description Snippet -->
        <p
          v-if="product.description"
          class="font-body m-0 text-xs text-brand-muted line-clamp-1 leading-relaxed"
        >
          {{ product.description }}
        </p>
      </div>

      <!-- Price & Interaction Footer -->
      <div
        class="pt-3 border-t border-brand-hairsoft/80 flex items-center justify-between gap-3 pointer-events-auto"
        @click.stop
      >
        <div class="flex flex-col">
          <span class="text-[10px] uppercase tracking-wider font-semibold text-brand-faint"
            >Harga</span
          >
          <span class="text-base sm:text-lg font-bold tracking-tight text-brand-ink tabular-nums">
            {{ formatRupiah(product.price) }}
          </span>
        </div>

        <!-- Public View: Subtle Quick Add (Always accessible on Mobile / Fallback) -->
        <div v-if="hideActions" class="flex items-center gap-2">
          <button
            v-if="product.stock > 0"
            type="button"
            class="sm:hidden w-8 h-8 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            :title="`Tambah ${product.name} ke Keranjang`"
            :aria-label="`Tambah ${product.name} ke Keranjang`"
            @click.stop="handleQuickAdd"
          >
            <i v-if="justAdded" class="pi pi-check text-xs text-brand-success" />
            <i v-else class="pi pi-shopping-bag text-xs" />
          </button>
          <span v-else class="text-xs font-medium text-brand-muted"> Habis </span>
        </div>

        <!-- Admin View Actions (Management Mode) -->
        <div v-else class="flex items-center gap-1.5">
          <template v-if="isTrash">
            <UiButton
              variant="secondary"
              size="sm"
              icon="pi-refresh"
              @click="emit('restore', product.id)"
            >
              Restore
            </UiButton>
          </template>
          <template v-else>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-muted transition-colors flex items-center justify-center cursor-pointer border border-brand-hair"
              title="Ubah Produk"
              @click="emit('edit', product)"
            >
              <i class="pi pi-pencil text-xs" />
            </button>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-brand-canvas-soft hover:bg-red-600 hover:text-white text-brand-muted transition-colors flex items-center justify-center cursor-pointer border border-brand-hair"
              title="Hapus Produk"
              @click="emit('delete', product.id)"
            >
              <i class="pi pi-trash text-xs" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
