<script setup lang="ts">
import type { OrderItem, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  items?: OrderItem[]
  orderStatus: OrderStatus
}>()

defineEmits<{
  review: [item: OrderItem]
}>()
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-4">
    <h2
      class="font-display text-base font-bold text-brand-ink m-0 pb-3 border-b border-brand-hairsoft"
    >
      Daftar Barang Belanja
    </h2>

    <div class="divide-y divide-brand-hairsoft">
      <article
        v-for="item in items"
        :key="item.id"
        class="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-16 h-16 rounded-card bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
          >
            <img
              v-if="item.product?.image_url"
              :src="item.product.image_url"
              :alt="item.product?.name || 'Produk'"
              class="w-full h-full object-cover"
            />
            <i v-else class="pi pi-image text-brand-faint text-xl" />
          </div>

          <div class="min-w-0">
            <NuxtLink
              :to="`/product/${item.product_id}`"
              class="font-display font-semibold text-xs sm:text-sm text-brand-ink hover:text-brand-accent transition-colors no-underline line-clamp-1"
            >
              {{ item.product?.name || `Produk #${item.product_id}` }}
            </NuxtLink>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5">
              {{ item.qty }}x @ {{ formatRupiah(item.price_cents / 100) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="font-display font-bold text-xs sm:text-sm text-brand-ink tabular-nums">
            {{ formatRupiah((item.price_cents * item.qty) / 100) }}
          </span>
          <UiButton
            v-if="orderStatus === 'completed'"
            variant="outline"
            size="sm"
            @click="$emit('review', item)"
          >
            Beri Ulasan
          </UiButton>
        </div>
      </article>
    </div>
  </div>
</template>
