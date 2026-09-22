# Aturan Penulisan Teks & Copywriting (E-Commerce Customer-Centric)

## 1. Larangan Istilah Teknis di Antarmuka Pengguna (UI)

DILARANG KERAS menampilkan istilah teknis developer, nama framework, atau jargon internal pada halaman yang diakses konsumen (Beranda, Katalog, Detail Produk, Keranjang, Auth, Footer).

**Contoh yang DILARANG:**

- Nama framework / database: `Nuxt 4`, `Supabase`, `RLS strict`, `Vue 3`, `PostgreSQL`, `Tailwind`.
- Jargon telemetry / devops: `Telemetry Operational`, `Telemetry Realtime`, `Artifact #123`, `Audit realtime`, `API Gateway`.
- Jargon manufaktur berlebihan yang membingungkan konsumen: `Toleransi ±0.05mm Presisi billet CNC aluminium`, `Concealed Routing Tata kabel tanpa silang pandang`, `Archival Vault`.
- Nama software pihak ketiga yang tidak relevan: `Apache Spark`, `Kubernetes`, `Docker`.

## 2. Standar Bahasa Indonesia yang Alami dan Ramah Pengguna

- Gunakan Bahasa Indonesia yang sopan, jelas, dan fokus pada manfaat bagi konsumen (customer benefit).
- Ganti istilah teknis dengan padanan e-commerce umum:
  - `Telemetry Operational` ➔ `Layanan Pelanggan Aktif · Belanja Aman`
  - `Artifact #ID` ➔ `Katalog #ID` / `SKU: SS-ID`
  - `Vault Price` ➔ `Harga` / `Harga Spesial`
  - `In Stock` ➔ `Tersedia & Siap Kirim`
  - `Concealed Routing` ➔ `Desain Rapi & Fungsional`
  - `Garansi Integritas` ➔ `Garansi Resmi 100% Original`

## 3. Konsistensi Bahasa

- Seluruh teks storefront utama (Beranda, Auth, Katalog) menggunakan **Bahasa Indonesia** yang konsisten dan baku.
- Fitur multi-bahasa (i18n) akan diimplementasikan secara terpisah di akhir siklus pengembangan.

## 4. Hirarki Kontrol Navigasi & Anti-Slop Badges

- Hindari duplikasi tombol kategori/departemen yang berdekatan di header atau hero.
- Cukup sediakan SATU pemilih kategori yang terintegrasi (misal di dalam bar pencarian atau di bilah kategori pita).
- Hapus pill badge AI-slop yang melayang di atas heading (misal tag uppercase `ETALASE TERVERIFIKASI`, `KEUNGGULAN LAYANAN`, `TESTIMONI`, `Koleksi Terverifikasi` dengan pulsing green dot). Biarkan heading utama berbicara dengan jelas dan bersih.
- Hindari penomoran pseudo-militer/AI seperti `Divisi 01`, `Divisi 02`, dll. Gunakan nama kategori departemen yang natural dan ramah konsumen.
- Hindari duplikasi komponen seperti "Pilih Kategori Cepat" di Hero jika section "Kategori Pilihan" sudah ada tepat di bawahnya.
- Header e-commerce tidak memerlukan nav link redundant seperti "Katalog" yang bersanding dengan action bar, karena bilah kategori pita dan search bar sudah melayani navigasi produk secara terpadu.
