<script setup lang="ts">
import type { ReviewEligibility } from '~/types/review'
import ReviewCard from '~/components/product/ReviewCard.vue'

defineProps<{
  eligibility: ReviewEligibility
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  create: []
  delete: []
}>()
</script>

<template>
  <div class="rounded-card border border-brand-hair bg-brand-canvas-soft p-5 sm:p-6 space-y-3">
    <!-- State 1: User already reviewed -->
    <div v-if="eligibility.existing_review" class="space-y-3">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <h3 class="m-0 font-display text-sm font-bold text-brand-ink">Ulasan Anda</h3>
        </div>
        <div class="flex items-center gap-2">
          <UiButton variant="outline" size="xs" @click="emit('create')"> Edit Ulasan </UiButton>
          <UiButton
            variant="ghost"
            size="xs"
            class="text-rose-600 hover:text-rose-700"
            @click="emit('delete')"
          >
            Hapus
          </UiButton>
        </div>
      </div>
      <ReviewCard :review="eligibility.existing_review" />
    </div>

    <!-- State 2: User eligible to write a review -->
    <div
      v-else-if="eligibility.eligible"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div class="space-y-1">
        <h3 class="m-0 font-display text-sm font-bold text-brand-ink">Bagikan Pengalaman Anda</h3>
        <p class="m-0 text-xs text-brand-muted">
          Pesanan Anda telah selesai. Berikan penilaian Anda untuk membantu pembeli lain.
        </p>
      </div>
      <UiButton variant="primary" size="sm" @click="emit('create')"> Tulis Ulasan Produk </UiButton>
    </div>

    <!-- State 3: Guest user -->
    <div v-else-if="!isAuthenticated" class="text-xs text-brand-muted">
      <span>Sudah membeli produk ini? </span>
      <NuxtLink
        to="/auth/login"
        class="font-semibold text-brand-ink underline hover:text-brand-accent"
      >
        Masuk ke akun untuk menulis ulasan setelah pesanan selesai.
      </NuxtLink>
    </div>

    <!-- State 4: Authenticated user but not eligible -->
    <div v-else class="text-xs text-brand-muted">
      Ulasan hanya dapat ditulis oleh pembeli dengan pesanan yang telah selesai.
    </div>
  </div>
</template>
