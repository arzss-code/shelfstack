# ADR 002 — FSD-lite (Feature-Scoped) di Nuxt

- Status: Accepted. Tanggal: 2026-09-18.
- Konteks: `ARCHITECTURE.md` sudah tetapkan FSD-lite, tapi `app/stores/product.ts` + `app/repository/product.ts` masih global. Komponen spesifik fitur rawan bocor ke `app/components/`.
- Keputusan: **Satu fitur = satu folder di `app/features/<nama>/` berisi `schema.ts + stores/ + repository/ + composables/ + components/`.** `app/components/` hanya untuk global (`AppNavbar.vue`). `app/composables/` hanya untuk 100% global. `app/pages/` hanya routing.
- Aturan migrasi: copy → alias re-export → hapus lama (1 sprint). Maks 300 baris per komponen, logika ke composable/store.
- Konsekuensi: import path berubah sekali (codemod + alias sementara). Untung: fitur cart/orders bisa dicabut/diuji terpisah, onboarding lebih cepat.
