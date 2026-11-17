<script setup lang="ts">
import type { OrderItem } from '~/types/order'
import { formatRupiah } from '~/utils/format'

defineProps<{
  items?: OrderItem[]
}>()
</script>

<template>
  <section class="space-y-3">
    <table class="w-full text-left text-xs border-collapse">
      <thead>
        <tr
          class="border-b border-brand-hair text-brand-muted uppercase text-[10px] tracking-wider"
        >
          <th class="py-2.5 font-semibold w-8">No</th>
          <th class="py-2.5 font-semibold">Produk</th>
          <th class="py-2.5 font-semibold text-right">Harga Satuan</th>
          <th class="py-2.5 font-semibold text-center w-16">Jumlah</th>
          <th class="py-2.5 font-semibold text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-brand-hairsoft">
        <tr v-for="(item, idx) in items || []" :key="item.id">
          <td class="py-3 text-brand-muted font-mono">{{ idx + 1 }}</td>
          <td class="py-3 pr-4">
            <span class="font-bold text-brand-ink block">
              {{ item.product?.name || `Produk #${item.product_id}` }}
            </span>
            <span v-if="item.variant?.sku" class="text-[10px] font-mono text-brand-muted">
              SKU: {{ item.variant.sku }}
            </span>
          </td>
          <td class="py-3 text-right font-mono tabular">
            {{ formatRupiah(item.price_cents / 100) }}
          </td>
          <td class="py-3 text-center font-bold">
            {{ item.qty }}
          </td>
          <td class="py-3 text-right font-mono font-bold tabular">
            {{ formatRupiah((item.price_cents * item.qty) / 100) }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
