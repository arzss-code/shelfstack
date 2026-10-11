# MCP Setup — ShelfStack

> Berlaku untuk OpenCode. Terakhir diverifikasi: 2026-10-11.

## Arsitektur

| Lapisan                   | File                                                          | Isi                                                  | Di-commit?           |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- | -------------------- |
| Global (semua project)    | `C:\Users\<nama>\.config\opencode\opencode.json`              | `playwright`, `context7`, `e2e`, template `supabase` | N/A (mesin sendiri)  |
| Per project               | `opencode.json` di root repo                                  | Override `supabase` + `project-ref` repo itu         | Ya (tanpa secret)    |
| Secret (sekali per mesin) | `C:\Users\<nama>\.config\opencode\secrets\supabase-token.txt` | Token `sbp_...` saja, 1 baris                        | Tidak (di luar repo) |

Aturan main: **project menimpa global** (precedence tertinggi). Repo tanpa
`opencode.json` jatuh ke template global + `SUPABASE_PROJECT_REF` dari env.
Repo dengan `opencode.json` (seperti repo ini) selalu memakai ref-nya sendiri.

## Setup sekali per mesin

1. Buat Personal Access Token di `supabase.com/dashboard/account/tokens`
   (jangan pakai anon key / `service_role`).
2. Isi file `secrets/supabase-token.txt` dengan token itu saja
   (satu baris, tanpa spasi/baris lain).
3. Quit total OpenCode → buka ulang → panel MCP harus hijau semua.

> `.env` project TIDAK dibaca OpenCode (itu urusan Nuxt).
> `{env:...}` / `{file:...}` dibaca dari proses OpenCode saat start.

## Tambah project Supabase baru

1. Copy `opencode.json` repo ini ke repo baru.
2. Ganti 1 baris `project-ref` dengan ref project itu
   (dari subdomain `https://<ref>.supabase.co`).
3. Selesai — token tidak perlu disentuh.

## Troubleshooting

| Gejala                                         | Penyebab paling mungkin                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase: MCP error -32000 Connection closed` | Token salah jenis (bukan `sbp_...`), file token masih placeholder, atau OpenCode dibuka sebelum token diisi (quit total + buka ulang) |
| Server lain hijau, supabase merah              | Hampir pasti token, bukan network — yang lain tidak butuh secret                                                                      |
| Lambat saat pertama connect                    | `pnpm dlx` sedang download package (`timeout: 30000` sudah dipasang untuk ini)                                                        |
| `opencode mcp list` tidak muncul               | Config belum reload — restart OpenCode                                                                                                |

Tes manual (dengan token valid):

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
pnpm dlx @supabase/mcp-server-supabase@latest --read-only --project-ref=<ref>
```

Crash langsung = argumen salah. Diam menunggu input = argumen benar,
masalah di sisi env/file OpenCode.

## Keamanan

- Yang boleh di-commit: `project-ref` (publik) + placeholder `{env:}`/`{file:}`.
- Yang tidak boleh: token dalam bentuk apa pun (cek: `git log -S "sbp_" --oneline` harus kosong).
- Server Supabase selalu `--read-only` (least privilege).
- Guard `.gitignore`: `.secrets/`, `*.token.txt`, `.mcp.json`, `.env`.
