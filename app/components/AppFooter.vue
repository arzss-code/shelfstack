<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

const { isLoggedIn, isAdmin } = useAuth()
</script>

<template>
  <footer
    class="w-full bg-brand-ink text-white rounded-t-card mt-16 border-t border-brand-hairsoft overflow-hidden"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-brand-ink-soft"
      >
        <!-- Brand Info Column -->
        <div class="lg:col-span-5 flex flex-col items-start gap-4">
          <div class="flex items-center gap-3">
            <AppLogo variant="inverse" size="lg" />
          </div>
          <p class="font-body text-sm leading-relaxed text-white/70 max-w-sm m-0">
            Kurasi perlengkapan kerja, audio, furnitur, dan kebutuhan rumah tangga modern dengan
            standar kualitas terpercaya dan jaminan keaslian.
          </p>

          <div
            class="mt-2 inline-flex items-center gap-2 bg-brand-ink-soft px-3.5 py-1.5 rounded-full text-xs font-medium text-white/90"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-brand-success" />
            <span>Layanan Pelanggan Aktif · 100% Produk Terverifikasi</span>
          </div>
        </div>

        <!-- Links Columns (Human-friendly e-commerce navigation) -->
        <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-white/50">
              Katalog
            </span>
            <nav class="flex flex-col gap-2 text-sm" aria-label="Navigasi Katalog">
              <NuxtLink
                to="/katalog"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Semua Produk
              </NuxtLink>
              <NuxtLink
                to="/katalog"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Tech &amp; Gadget
              </NuxtLink>
              <NuxtLink
                to="/katalog"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Rumah &amp; Dapur
              </NuxtLink>
              <NuxtLink
                to="/katalog"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Furnitur &amp; Meja
              </NuxtLink>
              <NuxtLink
                to="/katalog"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Promo &amp; Diskon
              </NuxtLink>
            </nav>
          </div>

          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-white/50">
              Bantuan
            </span>
            <nav class="flex flex-col gap-2 text-sm" aria-label="Navigasi Bantuan">
              <NuxtLink
                to="/help"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Pusat Bantuan
              </NuxtLink>
              <NuxtLink
                to="/tracking"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Lacak Pesanan
              </NuxtLink>
              <NuxtLink
                to="/help#pengembalian"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Kebijakan Pengembalian
              </NuxtLink>
              <NuxtLink
                to="/help#pengiriman"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Informasi Pengiriman
              </NuxtLink>
              <NuxtLink
                to="/contact"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Hubungi Kami
              </NuxtLink>
            </nav>
          </div>

          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-white/50">
              Akun &amp; Toko
            </span>
            <nav class="flex flex-col gap-2 text-sm" aria-label="Navigasi Akun">
              <NuxtLink
                to="/about"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Tentang Kami
              </NuxtLink>
              <template v-if="!isLoggedIn">
                <NuxtLink
                  to="/auth/login"
                  class="text-white/80 hover:text-white transition-colors no-underline"
                >
                  Masuk
                </NuxtLink>
                <NuxtLink
                  to="/auth/register"
                  class="text-white/80 hover:text-white transition-colors no-underline"
                >
                  Daftar Akun Baru
                </NuxtLink>
              </template>
              <template v-else>
                <NuxtLink
                  to="/orders"
                  class="text-white/80 hover:text-white transition-colors no-underline"
                >
                  Pesanan Saya
                </NuxtLink>
              </template>
              <NuxtLink
                v-if="isAdmin"
                to="/admin/products"
                class="text-white/80 hover:text-white transition-colors no-underline"
              >
                Kelola Produk (Admin)
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>

      <!-- Bottom Credits Row -->
      <div
        class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60"
      >
        <p class="m-0">
          &copy; 2026 ShelfStack Indonesia. Belanja kebutuhan harian dengan aman dan nyaman.
        </p>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/about"
            class="text-white/60 hover:text-white transition-colors no-underline"
          >
            Tentang Kami
          </NuxtLink>
          <span class="w-1 h-1 rounded-full bg-white/40" />
          <NuxtLink
            to="/contact"
            class="text-white/60 hover:text-white transition-colors no-underline"
          >
            Kontak
          </NuxtLink>
          <span class="w-1 h-1 rounded-full bg-white/40" />
          <NuxtLink
            to="/katalog"
            class="text-white/60 hover:text-white transition-colors no-underline"
          >
            Syarat &amp; Ketentuan
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
