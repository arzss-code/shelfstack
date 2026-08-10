---
name: Talenavi Product Hub
colors:
  surface: "oklch(0.99 0 0)"
  surface-dim: "oklch(0.96 0.01 255)"
  surface-bright: "oklch(1 0 0)"
  surface-container-lowest: "oklch(1 0 0)"
  surface-container-low: "oklch(0.97 0.01 255)"
  surface-container: "oklch(0.95 0.01 255)"
  surface-container-high: "oklch(0.92 0.02 255)"
  surface-container-highest: "oklch(0.89 0.02 255)"
  on-surface: "oklch(0.15 0.02 255)"
  on-surface-variant: "oklch(0.35 0.03 255)"
  inverse-surface: "oklch(0.20 0.02 255)"
  inverse-on-surface: "oklch(0.96 0.01 255)"
  outline: "oklch(0.55 0.03 255)"
  outline-variant: "oklch(0.85 0.02 255)"
  primary: "oklch(0.45 0.16 250)"
  on-primary: "oklch(0.98 0.02 250)"
  primary-container: "oklch(0.92 0.05 250)"
  on-primary-container: "oklch(0.25 0.10 250)"
  inverse-primary: "oklch(0.75 0.12 250)"
  secondary: "oklch(0.50 0.06 255)"
  on-secondary: "oklch(0.98 0 0)"
  secondary-container: "oklch(0.92 0.03 255)"
  on-secondary-container: "oklch(0.25 0.05 255)"
  tertiary: "oklch(0.48 0.05 200)"
  on-tertiary: "oklch(0.98 0 0)"
  tertiary-container: "oklch(0.93 0.03 200)"
  on-tertiary-container: "oklch(0.25 0.04 200)"
  error: "oklch(0.45 0.15 25)"
  on-error: "oklch(0.98 0 0)"
  error-container: "oklch(0.92 0.05 25)"
  on-error-container: "oklch(0.25 0.10 25)"
  background: "oklch(0.98 0.01 255)"
  on-background: "oklch(0.15 0.02 255)"
  border: "oklch(0.88 0.02 255)"
  divider: "oklch(0.92 0.02 255)"
typography:
  font-family:
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace"
  scale:
    h1:
      size: "2.5rem"
      weight: "600"
      tracking: "-0.03em"
      line-height: "1.1"
    h2:
      size: "2rem"
      weight: "600"
      tracking: "-0.02em"
      line-height: "1.2"
    h3:
      size: "1.5rem"
      weight: "600"
      tracking: "-0.01em"
      line-height: "1.3"
    body-lg:
      size: "1.125rem"
      weight: "400"
      tracking: "0"
      line-height: "1.6"
    body:
      size: "1rem"
      weight: "400"
      tracking: "0"
      line-height: "1.5"
    small:
      size: "0.875rem"
      weight: "400"
      tracking: "0"
      line-height: "1.4"
    label:
      size: "0.75rem"
      weight: "500"
      tracking: "0.01em"
      line-height: "1.4"
spacing:
  container: "1200px"
  section-padding: "4rem"
  grid-gap: "1.5rem"
rounded:
  sm: "4px"
  base: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
---

# Talenavi Product Hub — Design Specification

Versi: 2.0 (Redesign)

---

# 1. Overview & Positioning

**Talenavi Product Hub** adalah dashboard pengelolaan produk kelas _enterprise_. Ini bukan aplikasi konsumen kasual, melainkan _tool_ kerja yang mengutamakan kecepatan, efisiensi, dan kejelasan data.

**Vibe yang ingin dicapai:**

- Instrumental. (Berfungsi seperti instrumen bedah atau alat profesional).
- _Data-dense_ tapi tidak sumpek.
- Netral dengan aksen biru yang tajam dan berwibawa, bukan biru kekanak-kanakan atau biru startup generik (SaaS-cream).
- Terinspirasi oleh antarmuka developer (GitHub, Linear, Vercel) alih-alih aplikasi sosial.

---

# 2. Design Principles (Anti-Slop)

Kami menerapkan standar `impeccable` untuk menghindari klise desain AI (_AI slop_).

1. **No "Cream/Sand" Backgrounds:** Warna latar menggunakan putih bersih (`oklch(0.99 0 0)`) atau _cool-gray_ yang sangat halus (`oklch(0.98 0.01 255)`), bukan krem/beige yang merupakan _default_ halusinasi AI.
2. **No Fake Shadows:** Kartu-kartu UI menggunakan _border_ padat (1px solid `oklch(0.88 0.02 255)`), BUKAN _drop-shadow_ tebal `16px+` ala "ghost card".
3. **No Over-rounding:** _Border-radius_ maksimal untuk kartu adalah `12px`. Menggunakan `24px` atau `32px` untuk elemen antarmuka administrasi akan dilarang karena terlihat seperti mainan.
4. **No Eyebrow Kickers:** Dilarang menggunakan teks kecil kapital tebal dengan _letter-spacing_ sangat lebar di atas setiap _heading_ (misal: "A B O U T U S"). Jika ada pengelompokan data, gunakan label _inline_ yang semantik.
5. **No Decorative Side-stripes:** Dilarang menggunakan `border-left: 4px solid blue` sebagai penanda peringatan kecuali memang benar-benar kritis. Gunakan pewarnaan _background_ halus atau _full border_ jika diperlukan.

---

# 3. Color Strategy: Committed Professionalism

Alih-alih palet monokrom atau palet 6-warna pelangi, kita menggunakan pendekatan **Restrained + One Sharp Accent**.

- **Primary Brand (Blue):** `oklch(0.45 0.16 250)` — Biru yang dalam, jernih, dengan _chroma_ yang cukup untuk menarik perhatian tanpa menyilaukan. (Menghindari biru pudar atau biru neon).
- **Background:** Sangat dingin/bersih.
- **Teks:** Kontras tinggi dijaga dengan ketat. Teks tubuh utama menggunakan `oklch(0.15 0.02 255)` (Nyaris hitam dengan sedikit _tint_ biru). _Placeholder_ input dan teks sekunder tidak boleh lebih terang dari `oklch(0.35 0.03 255)` (memenuhi rasio kontras WCAG 4.5:1).

---

# 4. Typography

- **Primary Font:** `Inter` (Atau sistem _default_ seperti SF Pro di Apple).
- **Hierarchy:** Berhenti meneriakkan informasi.
  - _Display headings_ dibatasi maksimum `2.5rem` (`40px`), dengan _letter-spacing_ ketat `-0.03em`. Huruf tidak boleh saling menempel.
  - _Body copy_ dibatasi maksimal `65-75` karakter per baris agar nyaman dibaca.
- **Tabel & Data:** Semua angka menggunakan _tabular nums_ (`font-variant-numeric: tabular-nums;`) agar kolom harga dan ID rata secara vertikal.

---

# 5. Motion & Interaction

Gerakan (animasi) hanya ada untuk memberikan umpan balik (feedback), bukan untuk pamer.

- **Transisi:** _Hover state_ pada tombol atau _row_ tabel menggunakan `150ms ease-out`.
- **Tidak ada "Scroll Reveal":** Jangan menyembunyikan konten di balik animasi `opacity: 0` + `translateY` yang baru muncul saat di-_scroll_. Konten tabel dan form harus langsung tersedia. Waktu _user_ sangat berharga.
- **Dialogs & Modals:** Menggunakan _native API_ atau komponen Vue/PrimeVue yang dirender di level atas (_root portal_), tampil dengan animasi _fade-in_ cepat `150ms`.

---

# 6. Layout & Grid

- **Layout 1D vs 2D:** Gunakan Flexbox untuk alur form vertikal, dan CSS Grid murni untuk layout dashboard besar.
- **Form Layout:** Jangan buat input memenuhi seluruh layar (100% width pada layar ultrawide). Berikan _max-width_ (contoh: `600px`) pada form input demi ergonomi visual.
- **Z-Index:** Patuhi skala semantik lokal, bukan `9999`.
  - `10` Sticky Header
  - `40` Modal Backdrop
  - `50` Modal Content
  - `100` Toast / Tooltip

---

# 7. Komponen Esensial

### A. Tabel Data (Product List)

- Tanpa bayangan (_No shadow_).
- Garis bawah pemisah baris (`border-bottom`).
- _Zebra striping_ sangat tipis (`oklch(0.97 0.01 255)`) jika baris sangat lebar.
- Aksi (Edit/Delete) menggunakan tombol _icon_ berukuran kompak di sebelah kanan, sejajar.

### B. Form Produk (Product Form)

- _Label_ diletakkan di atas _input field_, di-bold `500`.
- _Input field_ memiliki `border: 1px solid oklch(0.85 0.02 255)` dan berubah menjadi warna _Primary_ saat `focus`, dengan _ring_ halus.
- Jarak antar field (`gap`) seragam: `1.5rem`.

---

# 8. Kriteria Penerimaan (The AI Slop Test)

Jika antarmuka akhir:

1. Memiliki warna latar krem,
2. _Heading_-nya raksasa dan terpotong di mobile,
3. Semua kartunya memiliki bayangan tebal,
4. Atau ada teks kapital kecil berjarak renggang di atas judul form...
   Maka desain tersebut GAGAL dan harus ditulis ulang. Desain Talenavi Product Hub harus terlihat layaknya buatan _engineer_ senior yang menghargai fungsi dan kebersihan visual murni.
