<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'

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

const navigateToDetail = () => {
  router.push(`/product/${props.product.id}`)
}
</script>

<template>
  <article
    class="product-card group flex flex-col bg-brand-canvas border border-brand-hairsoft rounded-card overflow-hidden transition-all duration-300 hover:border-brand-hair hover:shadow-floating cursor-pointer"
    @click="navigateToDetail"
  >
    <!-- Media Container -->
    <div
      class="relative aspect-square w-full bg-brand-field overflow-hidden flex items-center justify-center p-3 border-b border-brand-hairsoft"
    >
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover rounded-media transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="flex items-center justify-center w-full h-full text-brand-faint bg-brand-canvas-soft rounded-media"
      >
        <i class="pi pi-image text-3xl" />
      </div>

      <!-- Stock Status Badge -->
      <div class="absolute top-3 left-3 pointer-events-none">
        <UiBadge v-if="product.stock === 0" label="Habis" variant="danger" />
        <UiBadge v-else-if="product.stock < 5" :label="`Sisa ${product.stock}`" variant="warning" />
        <UiBadge v-else label="Tersedia" variant="success" />
      </div>

      <!-- Quick view indicator -->
      <div
        class="absolute bottom-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span
          class="inline-flex items-center gap-1 bg-brand-canvas/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-brand-ink shadow-whisper"
        >
          <span>Detail</span>
          <i class="pi pi-arrow-right text-[10px]" />
        </span>
      </div>
    </div>

    <!-- Content Body -->
    <div class="p-5 flex flex-col flex-1 justify-between gap-3">
      <div>
        <div class="flex items-center justify-between text-xs text-brand-muted mb-1">
          <span class="font-medium text-[11px] text-brand-muted tracking-tight">
            Katalog #{{ product.id }}
          </span>
          <span class="text-[11px] text-brand-muted tabular-nums"> Stok: {{ product.stock }} </span>
        </div>

        <h3
          class="font-display m-0 text-base sm:text-lg font-bold text-brand-ink line-clamp-1 group-hover:text-brand-accent transition-colors"
          :title="product.name"
        >
          {{ product.name }}
        </h3>

        <p class="font-body m-0 mt-1.5 text-xs text-brand-muted line-clamp-2 leading-relaxed">
          {{ product.description || 'Deskripsi kurasi produk esensial untuk kebutuhan modern.' }}
        </p>
      </div>

      <!-- Price & Action Section -->
      <div
        class="mt-2 pt-3 border-t border-brand-hairsoft flex items-center justify-between gap-2"
        @click.stop
      >
        <div>
          <span class="text-[11px] font-medium text-brand-muted block">Harga</span>
          <span class="text-base sm:text-lg font-bold tracking-tight text-brand-ink tabular-nums">
            {{ formatRupiah(product.price) }}
          </span>
        </div>

        <!-- Public View Action -->
        <UiButton
          v-if="hideActions"
          :to="`/product/${product.id}`"
          variant="secondary"
          size="sm"
          icon="pi-arrow-right"
          icon-pos="right"
        >
          Detail
        </UiButton>

        <!-- Admin Actions -->
        <div v-else class="flex items-center gap-1">
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
