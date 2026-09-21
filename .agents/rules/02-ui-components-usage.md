# ATURAN PENGGUNAAN KOMPONEN UI GLOBAL (DESIGN SYSTEM)

File ini berisi panduan wajib bagi AI dan Developer dalam menggunakan komponen global di `app/components/ui/`.

**ATURAN UTAMA:**
DILARANG KERAS meracik Tailwind secara manual (hardcode class) untuk tombol, input, badge, atau card standar. SELALU gunakan komponen di bawah ini. Komponen sudah ter-import otomatis oleh Nuxt.

---

## 1. `<UiButton>`

Gunakan untuk semua aksi klik, _submit form_, atau navigasi utama (sebagai pengganti `<NuxtLink>` yang di-styling seperti tombol).

**Props Utama:**

- `variant` (string): `'primary'` (default, bg-ink), `'secondary'` (garis luar abu), `'accent'` (biru), `'outline'`, `'ghost'`.
- `size` (string): `'sm'`, `'md'` (default), `'lg'`.
- `to` (string): Jika diisi rute (contoh: `to="/katalog"`), otomatis me-render `<NuxtLink>`. Jika kosong, merender `<button>`.
- `loading` (boolean): Menampilkan spinner dan mendisable tombol otomatis.
- `icon` (string): Class dari PrimeIcons (contoh: `'pi-arrow-right'`).
- `iconPos` (string): `'left'` (default) atau `'right'`.
- `block` (boolean): `true` untuk membuat tombol full width (`w-full`).

**Contoh Penggunaan:**

```vue
<!-- Tombol Submit Form -->
<UiButton type="submit" variant="primary" :loading="isPending" block>
  Simpan Data
</UiButton>

<!-- Link Navigasi (Otomatis jadi NuxtLink) -->
<UiButton to="/katalog" variant="accent" icon="pi-shopping-cart" iconPos="left">
  Mulai Belanja
</UiButton>
```

---

## 2. `<UiInput>`

Gunakan untuk semua input teks form. Komponen ini otomatis menghandle label, styling error, dan penempatan icon.

**Props Utama:**

- `v-model` (string/number): Binding nilai.
- `label` (string): Teks label di atas input.
- `type` (string): `'text'` (default), `'email'`, `'password'`, dll.
- `placeholder` (string): Teks bayangan.
- `error` (string): Pesan error. Jika diset, border otomatis berubah merah muda/merah.
- `leftIcon` / `rightIcon` (string): Class PrimeIcons (contoh: `'pi-search'`).

**Contoh Penggunaan:**

```vue
<UiInput
  v-model="searchQuery"
  label="Cari Produk"
  placeholder="Ketik nama produk..."
  leftIcon="pi-search"
  :error="errorMessage"
/>
```

---

## 3. `<UiBadge>`

Gunakan untuk label status, kategori, atau penanda visual berukuran kecil (pill).

**Props Utama:**

- `label` (string, Wajib): Teks di dalam badge.
- `variant` (string): `'default'` (abu-abu), `'success'` (hijau), `'warning'` (kuning), `'danger'` (merah), `'info'` (biru).

**Contoh Penggunaan:**

```vue
<UiBadge label="Stok Habis" variant="danger" />
<UiBadge label="Gratis Ongkir" variant="success" />
```

---

## 4. `<UiCard>`

Gunakan sebagai kontainer standar untuk memisahkan bagian/seksi di UI. Sudah mengandung border, shadow standar ShelfStack, dan background putih.

**Props Utama:**

- `padded` (boolean): `true` (default), memberi padding standar `p-5 sm:p-6`.
- `hoverable` (boolean): `false` (default). Jika `true`, menambah efek shadow melayang saat di-hover (cocok untuk card produk/kategori yang bisa diklik).

**Contoh Penggunaan:**

```vue
<UiCard hoverable>
  <h3 class="text-lg font-bold">Fitur Premium</h3>
  <p>Deskripsi fitur ditaruh di sini.</p>
</UiCard>
```
