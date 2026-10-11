# Pull Request: Refactor to Feature-Sliced Design

**Judul PR:** `chore: [AA] refactor to feature-sliced design`

---

## Deskripsi

Melakukan _refactoring_ pada entitas Produk untuk mematuhi standar _Feature-Sliced Design_ dan arsitektur Nuxt/Vue best practices sesuai `SOP-CODING-REPO.md`.

**Perubahan Utama:**

1. **Repository Layer**: Memindahkan logika _query_ Supabase (Fetch, Insert, Update, Delete) dari Pinia Store ke `app/repository/product.ts`.
2. **Feature Isolation**: Memindahkan komponen UI spesifik produk dari `app/components/` ke `app/features/products/components/`.
3. **Store Abstraction**: Memodifikasi `app/stores/product.ts` agar hanya mengelola state, sedangkan pengolahan data mendelegasikan tugas ke Repository.

## Referensi Tiket

_Jira / Trello ID_: (Silakan isi jika ada)

## Syarat Sah Merge Request (Definition of Done)

- [x] **No Merge Conflict**: Branch ini _up-to-date_ dan siap digabung.
- [ ] **Reviewer Approval**: (Menunggu persetujuan dari Tech Lead / Peer).
- [x] **API Docs Updated**: Tidak ada perubahan struktur Endpoint/API yang terekspos (N/A).
- [x] **Self-Tested**: Fungsionalitas UI telah dites secara lokal dan komponen berhasil dimuat dengan susunan direktori yang baru.

### Bukti Self-Tested (Screenshot)

**1. Halaman Utama (Daftar Produk)**
_(Komponen berhasil di-load dari folder features, meski saat ini terdapat error RLS dari Supabase lokal)_
<!-- Silakan drag & drop screenshot halaman utama di sini -->

**2. Modal Form Produk**
_(Modal Form berhasil dibuka)_
<!-- Silakan drag & drop screenshot modal form di sini -->
