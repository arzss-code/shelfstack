#!/usr/bin/env node
/**
 * ShelfStack Database Seeder Runner via Supabase CLI
 * Usage:
 *   pnpm db:seed             (Remote Supabase Cloud linked project)
 *   pnpm db:seed:local       (Local Supabase Docker stack)
 *   node scripts/seed.mjs --remote
 *   node scripts/seed.mjs --local
 */

import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)
const isHelp = args.includes('--help') || args.includes('-h')
const isLocal = args.includes('--local') || args.includes('-l')
const isRemote = args.includes('--remote') || args.includes('-r') || !isLocal

if (isHelp) {
  console.log(`
ShelfStack Database Seeder CLI Runner

Penggunaan:
  pnpm db:seed             Jalankan seeder ke database remote Supabase Cloud
  pnpm db:seed:local       Jalankan seeder ke database lokal Supabase (Docker)
  pnpm db:seed:remote      Jalankan seeder ke database remote Supabase Cloud

Opsi flags:
  --remote, -r             Target ke project Supabase Cloud yang terhubung
  --local, -l              Target ke stack Supabase lokal (127.0.0.1:54322)
  --help, -h               Tampilkan bantuan ini
`)
  process.exit(0)
}

const seedPath = resolve(process.cwd(), 'supabase/seed.sql')

if (!existsSync(seedPath)) {
  console.error(`[ERROR] File seeder tidak ditemukan di: ${seedPath}`)
  process.exit(1)
}

const stats = statSync(seedPath)
const targetLabel = isRemote
  ? 'Remote Supabase Cloud (Linked Project: ShelfStack mbcyttxkfppcdvwitrif)'
  : 'Local Supabase Docker (127.0.0.1:54322)'

console.log('=================================================================')
console.log('🌱 ShelfStack Database Seeder Runner')
console.log(`📌 Target    : ${targetLabel}`)
console.log(`📄 SQL File  : supabase/seed.sql (${(stats.size / 1024).toFixed(1)} KB)`)
console.log('=================================================================\n')

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const cliArgs = ['dlx', 'supabase', 'db', 'query']

if (isRemote) {
  cliArgs.push('--remote')
}

cliArgs.push('-f', 'supabase/seed.sql')

const child = spawn(pnpmBin, cliArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ [SUKSES] Data seeder berhasil dieksekusi ke database.')
  } else {
    console.error(`\n❌ [GAGAL] Eksekusi seeder selesai dengan kode keluar: ${code}`)
    if (isRemote) {
      console.log('\n💡 Tips jika autentikasi remote gagal:')
      console.log('  1. Pastikan Anda sudah login ke Supabase CLI: pnpm dlx supabase login')
      console.log('  2. Atau jalankan link project terlebih dahulu: pnpm dlx supabase link --project-ref mbcyttxkfppcdvwitrif')
      console.log('  3. Anda juga selalu bisa menyalin isi supabase/seed.sql ke SQL Editor di dashboard Supabase.')
    } else {
      console.log('\n💡 Tips untuk database lokal:')
      console.log('  1. Pastikan Docker Desktop sedang aktif.')
      console.log('  2. Jalankan lokal Supabase dengan: pnpm dlx supabase start')
    }
  }
  process.exit(code ?? 1)
})
