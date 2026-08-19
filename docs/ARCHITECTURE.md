# Panduan Arsitektur: Feature-Scoped Development (FSD-Lite)

Repositori ini mengadopsi pola **Feature-Scoped Development (FSD-lite)** yang dikombinasikan dengan standar arsitektur **Nuxt 3**. Tujuannya adalah menjaga agar _codebase_ tetap bersih, skalabel, dan modul-modul tidak saling tumpang tindih (_high cohesion, low coupling_).

## Struktur Direktori Utama

- `app/pages/`: Hanya berisi komponen _Routing_ (Halaman). Dilarang menulis logika bisnis yang panjang di dalam komponen halaman. Halaman bertugas memanggil komponen _Feature_ dan merangkainya.
- `app/layouts/`: Berisi kerangka tata letak antarmuka pengguna secara global (misalnya `default.vue` dengan _Navbar_ dan _Footer_).
- `app/features/`: **[FSD Core]** Ini adalah jantung proyek. Setiap fitur besar (misalnya `products`, `activities`) memiliki ruang lingkup tersendiri.
- `app/composables/`: (Atau `utils/`) Untuk logika yang bersifat 100% _Global_ dan digunakan berulang di berbagai fitur.

## Aturan Komponen & Logika (_Feature Isolation_)

1. **Jangan letakkan semua komponen di `app/components/`**. Jika sebuah komponen hanya digunakan untuk satu fitur (misalnya `ActivityDetailDialog.vue`), letakkan di `app/features/<nama-fitur>/components/`.
2. **Isolasi Logika (_Composables_)**. Jika sebuah berkas `.ts` (composable) hanya berisi tata kelola status/logika untuk aktivitas spesifik (misalnya `useActivities.ts`), letakkan di `app/features/activities/composables/useActivities.ts`. Hal ini menjaga modul `activities` dapat dicabut atau diuji secara terpisah dari `products`.
3. Gunakan `import` modular ke direktori fitur tersebut pada halaman Anda.

## Kepatuhan Terhadap SOP Talenavi

Semua arsitektur di atas tunduk pada **SOP-CODING-REPO**:

- Memisahkan logic dan view secara teratur.
- Aturan penamaan tetap menggunakan _camelCase_ untuk berkas logika, dan _PascalCase_ untuk berkas komponen.
- Menjaga komponen maksimal ~300 baris dengan mendelegasikan tugas ke _child-components_ atau _composables_.
