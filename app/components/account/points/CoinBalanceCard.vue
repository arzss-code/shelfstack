<script setup lang="ts">
interface Props {
  balanceCoins: number
  formattedBalance: string
  formattedRupiah: string
  lifetimeEarned: number
  lifetimeSpent: number
  hasClaimedWelcome: boolean
  isClaimingWelcome: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'claimWelcome'): void
}>()
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-6 text-white shadow-lg sm:p-8"
  >
    <!-- Decorative background coin glow -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-black/10 blur-xl"
    />

    <div class="relative z-10 flex flex-col gap-6">
      <!-- Header row: Title & Value equivalent -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl shadow-inner backdrop-blur-sm"
          >
            <i class="pi pi-dollar text-amber-100" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-amber-100">
              Saldo ShelfStack Koin
            </p>
            <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {{ formattedBalance }}
            </h2>
          </div>
        </div>

        <div
          class="rounded-full bg-black/20 px-4 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-sm"
        >
          Setara {{ formattedRupiah }}
        </div>
      </div>

      <!-- Welcome Bonus Promotion Banner (If not claimed yet) -->
      <div
        v-if="!hasClaimedWelcome"
        class="flex flex-col items-start justify-between gap-4 rounded-xl bg-white/15 p-4 backdrop-blur-md sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-amber-900 shadow"
          >
            <i class="pi pi-gift text-lg" />
          </div>
          <div>
            <p class="text-sm font-bold text-white">Bonus Sambutan 10.000 Koin</p>
            <p class="text-xs text-amber-100">
              Klaim sekarang dan hemat hingga Rp 10.000 pada belanja pertama Anda.
            </p>
          </div>
        </div>
        <button
          type="button"
          :disabled="isClaimingWelcome"
          class="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-amber-700 shadow-md transition-all hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-amber-600 disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
          @click="emit('claimWelcome')"
        >
          <i v-if="isClaimingWelcome" class="pi pi-spin pi-spinner text-sm" />
          <i v-else class="pi pi-sparkles text-sm text-amber-500" />
          <span>{{ isClaimingWelcome ? 'Mengklaim...' : 'Klaim 10.000 Koin' }}</span>
        </button>
      </div>

      <!-- Secondary Info Stats -->
      <div class="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-xs sm:text-sm">
        <div>
          <span class="block text-amber-200">Total Koin Didapat</span>
          <span class="font-bold text-white">
            {{ new Intl.NumberFormat('id-ID').format(lifetimeEarned) }} Koin
          </span>
        </div>
        <div>
          <span class="block text-amber-200">Total Koin Dipakai</span>
          <span class="font-bold text-white">
            {{ new Intl.NumberFormat('id-ID').format(lifetimeSpent) }} Koin
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
