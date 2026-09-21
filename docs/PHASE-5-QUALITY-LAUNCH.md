# Phase 5 — Quality, CI & Launch (Sprint 6, Minggu 12 + buffer)

> Goal: layak share ke perekrut. Backlog: Q-01 … Q-05.

## 1. CI `.github/workflows/ci.yml` (baru — folder sekarang kosong)

```yaml
name: CI
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm exec vue-tsc --noEmit
      - run: pnpm exec vitest run
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test --project=chromium
```

Tambahkan badge di README + branch protection (CI wajib hijau sebelum merge). Preview Vercel otomatis per PR.

## 2. Test Matrix (tambah dari yang ada)

| File                                                               | Jenis | Isi                                    |
| ------------------------------------------------------------------ | ----- | -------------------------------------- |
| `tests/unit/product-schema.spec.ts`                                | unit  | valid/invalid produk (dari Fase 0)     |
| `tests/unit/cart.spec.ts`                                          | unit  | add/setQty/remove/total/persist        |
| `tests/unit/order-transition.spec.ts`                              | unit  | matriks transisi legal/ilegal          |
| `tests/e2e/auth.spec.ts`                                           | e2e   | register→login→403 admin               |
| `tests/e2e/catalog.spec.ts`                                        | e2e   | search URL + filter + detail OG        |
| `tests/e2e/checkout.spec.ts`                                       | e2e   | cart→checkout→pay→stok berkurang       |
| `tests/e2e/admin-orders.spec.ts`                                   | e2e   | admin ubah status + realtime           |
| existing `home.spec.ts`, `product.spec.ts`, `api-products.spec.ts` | jaga  | perbaiki flaky (tambah seed + waitFor) |

Tips anti-flaky: seed deterministik per test (email random `test+<ts>@...`), `reuseExistingServer` di CI = false, `trace: on-first-retry` sudah ada di `playwright.config.ts`.

## 3. Deploy Checklist (Vercel + Supabase Cloud)

- [ ] Vercel env: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` (server only, jangan prefix `NUXT_PUBLIC_`), `APP_ENV=Production`.
- [ ] Supabase (satu project, lihat ADR/004): jalankan migrasi berurutan (`products → activity → profiles/categories → orders → rls`), buat bucket `product-images` (public read, admin write, 5MB, jpeg/png/webp), enable Realtime untuk `orders, activity_logs`. Backup via `pg_dump` sebelum push migrasi.
- [ ] Cleanup data seed bertanda sebelum launch (`delete` pola nama seed, verifikasi hanya data demo yang tersisa).
- [ ] `supabase/config.toml` redirect URL tambah domain Vercel prod + preview `*.vercel.app`.
- [ ] `nuxt.config.ts` CSP `img-src` sudah ada `https://*.supabase.co` — verifikasi gambar tampil di prod.
- [ ] Cek `/api/version` + `version.json 1.0.0` sama. Cek dark mode + 404 (`error.vue`) + `/admin` guard di prod.

## 4. Perf & A11y Gate

- Lighthouse mobile ≥90 (perf/a11y/best-practice/SEO). Simpan screenshot di PR launch.
- Manual: tab order logis (search → card → cart → checkout), focus visible, semua input berlabel, `alt` gambar, kontras ikut `DESIGN.md` (teks utama `oklch(0.15 0.02 255)`).
- 375px: tidak ada horizontal scroll di katalog/cart/checkout/admin.

## 5. Release

- Bump `version.json → 1.0.0`, `CHANGELOG.md` release notes (fitur, akun demo, link demo, breaking: `price` → `price_cents`).
- Tag `git tag v1.0.0 && git push --tags`.
- Ikuti `PORTFOLIO-PACKAGING.md` untuk README final + demo video.

## 6. DoD Launch

- [ ] CI hijau di `main`. [ ] Demo live dibuka incognito langsung jalan. [ ] Perekrut paham repo dalam 3 menit tanpa tanya.
