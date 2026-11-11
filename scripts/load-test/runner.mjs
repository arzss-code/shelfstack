#!/usr/bin/env node


import { spawnSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function resolveK6Binary() {
  if (process.env.K6_PATH && fs.existsSync(process.env.K6_PATH)) {
    return process.env.K6_PATH
  }

  // Cek executable di PATH sistem
  try {
    const isWindows = process.platform === 'win32'
    const cmd = isWindows ? 'where' : 'which'
    const check = spawnSync(cmd, ['k6'], { encoding: 'utf-8' })
    if (check.status === 0 && check.stdout) {
      const foundPath = check.stdout.split(/\r?\n/)[0].trim()
      if (foundPath && fs.existsSync(foundPath)) {
        return foundPath
      }
    }
  } catch {
    // Lanjut ke pemeriksaan path fallback
  }

  // Fallback path umum Windows
  const windowsCandidates = [
    'C:\\Program Files\\k6\\k6.exe',
    'C:\\Program Files (x86)\\k6\\k6.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'k6', 'k6.exe'),
  ]

  for (const candidate of windowsCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Fallback path Unix
  const unixCandidates = ['/usr/local/bin/k6', '/usr/bin/k6', '/opt/homebrew/bin/k6']
  for (const candidate of unixCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

export function formatSupabaseAuthCookie(supabaseUrl, session) {
  if (!supabaseUrl || !session) return ''
  const parsedUrl = new URL(supabaseUrl)
  const projectRef = parsedUrl.hostname.split('.')[0]
  const name = `sb-${projectRef}-auth-token`
  const rawJson = typeof session === 'string' ? session : JSON.stringify(session)
  const base64Val = Buffer.from(rawJson, 'utf8').toString('base64url')
  const encodedValue = `base64-${base64Val}`

  if (encodedValue.length <= 3180) {
    return `${name}=${encodedValue}`
  }

  const chunks = []
  for (let i = 0; i < encodedValue.length; i += 3180) {
    chunks.push(encodedValue.slice(i, i + 3180))
  }
  return chunks.map((chunk, idx) => `${name}.${idx}=${chunk}`).join('; ')
}

export async function authenticateSupabase(supabaseUrl, supabaseKey, email, password) {
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.warn(`[k6 Runner] Supabase auth gagal (${res.status}): ${text}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[k6 Runner] Error saat menghubungi endpoint autentikasi Supabase:', err)
    return null
  }
}

export function parseArgs(argv) {
  const args = argv.slice(2)
  const validScenarios = ['catalog', 'checkout', 'webhook', 'health', 'all']

  let scenario = 'all'
  let vus = null
  let duration = null
  let baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  let showHelp = false
  let auth = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      showHelp = true
    } else if (arg === '--auth') {
      auth = true
    } else if (arg === '--vus' && args[i + 1]) {
      vus = parseInt(args[++i], 10)
    } else if (arg === '--duration' && args[i + 1]) {
      duration = args[++i]
    } else if (arg === '--base-url' && args[i + 1]) {
      baseUrl = args[++i].replace(/\/+$/, '')
    } else if (!arg.startsWith('-') && validScenarios.includes(arg.toLowerCase())) {
      scenario = arg.toLowerCase()
    }
  }

  return { scenario, vus, duration, baseUrl, showHelp, auth }
}

export async function checkServerReachable(baseUrl) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${baseUrl}/api/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.status >= 200 && res.status < 500
  } catch {
    return false
  }
}
export async function detectWorkingBaseUrl(preferredUrl) {
  if (preferredUrl.includes('localhost:3000')) {
    if (await checkServerReachable('http://127.0.0.1:3000')) {
      return 'http://127.0.0.1:3000'
    }
    if (await checkServerReachable('http://[::1]:3000')) {
      return 'http://[::1]:3000'
    }
  }
  if (await checkServerReachable(preferredUrl)) {
    return preferredUrl
  }
  return preferredUrl
}


async function main() {
  const { scenario, vus, duration, baseUrl, showHelp, auth } = parseArgs(process.argv)

  if (showHelp) {
    console.log(`
ShelfStack k6 Load Testing Suite

Penggunaan:
  pnpm test:load [scenario] [options]

Skenario:
  catalog    Uji jelajah katalog, pencarian, filter kategori, dan sortir
  checkout   Uji konkurensi checkout dan integritas stok (Critical Inventory Test)
  webhook    Uji idempoten dan deduplikasi webhook Midtrans
  health     Uji liveness dan readiness telemetri
  all        Jalankan rangkaian pengujian beban penuh (default)

Opsi:
  --vus <n>          Jumlah virtual users (contoh: --vus 20)
  --duration <time>  Durasi pengujian (contoh: --duration 30s)
  --base-url <url>   URL server target (default: http://127.0.0.1:3000)
  --auth             Autentikasi customer via Supabase dan sematkan cookie sesi
  --help, -h         Tampilkan bantuan ini
`)
    process.exit(0)
  }

  const k6Path = resolveK6Binary()
  if (!k6Path) {
    console.error(`
[ERROR] Binary k6 tidak ditemukan di PATH atau Program Files.
Silakan pasang k6 dengan salah satu metode berikut:
  1. Windows (winget): winget install --id GrafanaLabs.k6
  2. macOS (brew):     brew install k6
  3. Linux:            sudo gpg -k && sudo apt-get install k6
  4. Docker fallback:  docker run --rm -i grafana/k6 run - < scripts/load-test/suite.js
`)
    process.exit(1)
  }

  console.log(`[k6 Runner] Menggunakan executable: ${k6Path}`)
  console.log(`[k6 Runner] Skenario: ${scenario.toUpperCase()}`)
  const targetUrl = await detectWorkingBaseUrl(baseUrl)
  console.log(`[k6 Runner] Target URL: ${targetUrl}`)

  const isServerUp = await checkServerReachable(targetUrl)
  if (!isServerUp) {
    console.warn(`
[PERINGATAN] Server target pada ${targetUrl} belum aktif atau tidak merespons /api/health.
Pastikan aplikasi berjalan di terminal lain sebelum menguji:
  pnpm dev
  atau
  pnpm build && pnpm preview
`)
  }

  // Supabase SSR session cookie resolution
  let authCookie = process.env.AUTH_COOKIE || ''
  const shouldAuthenticate =
    auth ||
    scenario === 'checkout' ||
    scenario === 'all'

  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY
  const customerEmail = process.env.E2E_CUSTOMER_EMAIL
  const customerPassword = process.env.E2E_CUSTOMER_PASSWORD

  if (!authCookie && shouldAuthenticate && supabaseUrl && supabaseKey && customerEmail && customerPassword) {
    console.log(`[k6 Runner] Mengautentikasi pengguna customer (${customerEmail}) via Supabase...`)
    const authData = await authenticateSupabase(supabaseUrl, supabaseKey, customerEmail, customerPassword)
    if (authData?.access_token) {
      authCookie = formatSupabaseAuthCookie(supabaseUrl, authData)
      console.log('[k6 Runner] Berhasil membuat cookie sesi Supabase SSR.')
    } else {
      console.warn('[k6 Runner] Gagal memperoleh sesi autentikasi dari Supabase.')
    }
  }

  // Tentukan file skenario target
  let scriptFile = path.join(__dirname, 'suite.js')
  if (scenario === 'catalog') {
    scriptFile = path.join(__dirname, 'scenarios', 'catalog-browse.js')
  } else if (scenario === 'checkout') {
    scriptFile = path.join(__dirname, 'scenarios', 'checkout-concurrency.js')
  } else if (scenario === 'webhook') {
    scriptFile = path.join(__dirname, 'scenarios', 'webhook-dedup.js')
  } else if (scenario === 'health') {
    scriptFile = path.join(__dirname, 'scenarios', 'health-readiness.js')
  }

  const k6Args = ['run']

  if (vus) {
    k6Args.push('--vus', String(vus))
  }
  if (duration) {
    k6Args.push('--duration', duration)
  }

  k6Args.push('-e', `BASE_URL=${targetUrl}`)
  k6Args.push('-e', `SCENARIO=${scenario}`)
  if (process.env.AUTH_TOKEN) {
    k6Args.push('-e', `AUTH_TOKEN=${process.env.AUTH_TOKEN}`)
  }
  if (authCookie) {
    k6Args.push('-e', `AUTH_COOKIE=${authCookie}`)
  }
  if (process.env.MIDTRANS_SERVER_KEY) {
    k6Args.push('-e', `MIDTRANS_SERVER_KEY=${process.env.MIDTRANS_SERVER_KEY}`)
  }

  k6Args.push(scriptFile)

  console.log(`[k6 Runner] Menjalankan: k6 ${k6Args.join(' ')}\n`)

  const child = spawn(k6Path, k6Args, {
    stdio: 'inherit',
    shell: false,
  })

  child.on('close', (code) => {
    process.exit(code ?? 0)
  })
}

// Jalankan jika dieksekusi langsung
if (process.argv[1] && process.argv[1].endsWith('runner.mjs')) {
  main().catch((err) => {
    console.error('[k6 Runner] Gagal menjalankan pengujian:', err)
    process.exit(1)
  })
}
