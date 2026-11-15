<script setup lang="ts">
import PointsPage from './points.vue'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Buku Kas Koin Loyalitas - ShelfStack',
  description:
    'Pantau saldo koin loyalitas ShelfStack, ledger mutasi transaksi cashback, dan tukar voucher diskon belanja eksklusif.',
})
</script>

<template>
  <PointsPage />
</template>
