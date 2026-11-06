<script setup lang="ts">
import type { Order } from '~/types/order'
import type { OrderStep } from '~/composables/useOrderDetail'

defineProps<{
  order: Order
  orderSteps: OrderStep[]
  getSegmentColor: (idx: number) => string
  formatDate: (dateStr: string) => string
}>()
</script>

<template>
  <div class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper">
    <div class="flex items-center justify-between pb-4 mb-6 border-b border-brand-hairsoft">
      <div class="flex items-center gap-2">
        <i class="pi pi-compass text-brand-accent text-sm" />
        <h2 class="font-display text-sm font-bold text-brand-ink m-0">
          Alur Pesanan &amp; Pengiriman
        </h2>
      </div>
    </div>

    <!-- Cancelled State Alert -->
    <div
      v-if="order.status === 'cancelled'"
      class="p-4 bg-red-50 text-red-700 border border-red-200 rounded-card text-xs flex items-start gap-3"
    >
      <i class="pi pi-times-circle text-lg shrink-0 text-red-600 mt-0.5" />
      <div class="space-y-1">
        <p class="font-semibold text-sm m-0">Pesanan Dibatalkan</p>
        <p v-if="order.cancellation_reason" class="text-xs text-red-700 m-0">
          Alasan: <span class="font-medium text-red-800">{{ order.cancellation_reason }}</span>
        </p>
        <p class="text-[11px] text-red-600/90 m-0">
          Dibatalkan pada
          {{ formatDate(order.cancelled_at || order.updated_at || order.created_at) }}. Stok produk
          telah dikembalikan ke etalase.
        </p>
      </div>
    </div>

    <!-- Active Stepper -->
    <div v-else class="relative pt-2 pb-1">
      <div class="grid grid-cols-4">
        <div
          v-for="(step, idx) in orderSteps"
          :key="step.title"
          class="relative flex flex-col items-center text-center"
        >
          <!-- Circle and Connector Row -->
          <div class="relative flex items-center justify-center w-full">
            <!-- Discrete Connector Line to Next Step -->
            <div
              v-if="idx < orderSteps.length - 1"
              class="absolute left-1/2 w-full top-1/2 -translate-y-1/2 h-0.5 z-0 transition-colors duration-300"
              :class="getSegmentColor(idx)"
            />

            <!-- Step Circle -->
            <div
              class="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-200"
              :class="[
                step.isCompleted
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                  : step.isActive && order.status === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm ring-4 ring-amber-100'
                    : step.isActive
                      ? 'bg-brand-accent text-white shadow-sm ring-4 ring-brand-accent/20'
                      : 'bg-white border-2 border-brand-hair text-brand-muted',
              ]"
            >
              <i v-if="step.isCompleted" class="pi pi-check text-xs" />
              <i
                v-else-if="step.isActive && order.status === 'pending'"
                class="pi pi-clock text-xs"
              />
              <span v-else>{{ idx + 1 }}</span>
            </div>
          </div>

          <!-- Step Info -->
          <div class="mt-3 px-1 w-full max-w-[160px] mx-auto">
            <p
              class="font-display font-bold text-[11px] sm:text-xs m-0 truncate"
              :class="[step.isCompleted || step.isActive ? 'text-brand-ink' : 'text-brand-muted']"
            >
              {{ step.title }}
            </p>
            <p
              class="text-[10px] sm:text-[11px] m-0 mt-0.5 leading-snug"
              :class="[
                step.isActive && order.status === 'pending'
                  ? 'text-amber-700 font-medium'
                  : 'text-brand-muted',
              ]"
            >
              {{ step.description }}
            </p>
            <p
              v-if="step.timestamp"
              class="text-[9px] sm:text-[10px] text-brand-faint m-0 mt-0.5 truncate"
            >
              {{ step.timestamp }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
