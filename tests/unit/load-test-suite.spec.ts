import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseArgs, resolveK6Binary } from '../../scripts/load-test/runner.mjs'

describe('k6 Load Testing Suite Verification', () => {
  const rootDir = process.cwd()
  const loadTestDir = path.join(rootDir, 'scripts', 'load-test')
  const scenarioFiles = [
    'catalog-browse.js',
    'checkout-concurrency.js',
    'webhook-dedup.js',
    'health-readiness.js',
  ]

  it('memastikan seluruh berkas skenario dan konfigurasi k6 tersedia', () => {
    expect(fs.existsSync(path.join(loadTestDir, 'common.js'))).toBe(true)
    expect(fs.existsSync(path.join(loadTestDir, 'suite.js'))).toBe(true)
    expect(fs.existsSync(path.join(loadTestDir, 'runner.mjs'))).toBe(true)

    for (const file of scenarioFiles) {
      const fullPath = path.join(loadTestDir, 'scenarios', file)
      expect(fs.existsSync(fullPath), `Berkas skenario ${file} wajib ada`).toBe(true)
    }
  })

  it('memvalidasi argumen CLI runner k6 dengan skenario spesifik dan flag', () => {
    const defaultParsed = parseArgs(['node', 'runner.mjs'])
    expect(defaultParsed.scenario).toBe('all')
    expect(defaultParsed.vus).toBeNull()
    expect(defaultParsed.duration).toBeNull()
    expect(defaultParsed.showHelp).toBe(false)

    const customParsed = parseArgs([
      'node',
      'runner.mjs',
      'checkout',
      '--vus',
      '25',
      '--duration',
      '45s',
      '--base-url',
      'http://localhost:5000',
    ])
    expect(customParsed.scenario).toBe('checkout')
    expect(customParsed.vus).toBe(25)
    expect(customParsed.duration).toBe('45s')
    expect(customParsed.baseUrl).toBe('http://localhost:5000')

    const helpParsed = parseArgs(['node', 'runner.mjs', '--help'])
    expect(helpParsed.showHelp).toBe(true)
  })

  it('mampu mendeteksi atau mereferensikan binary k6 executable', () => {
    // Uji kemampuan resolusi binary k6 di sistem
    const resolved = resolveK6Binary()
    if (resolved) {
      expect(typeof resolved).toBe('string')
      expect(fs.existsSync(resolved)).toBe(true)
    }

    // Uji dengan custom K6_PATH
    const prev = process.env.K6_PATH
    try {
      process.env.K6_PATH = path.join(loadTestDir, 'runner.mjs')
      expect(resolveK6Binary()).toBe(process.env.K6_PATH)
    } finally {
      process.env.K6_PATH = prev
    }
  })

  it('memverifikasi skenario katalog mendefinisikan ambang batas performa yang ketat', () => {
    const content = fs.readFileSync(
      path.join(loadTestDir, 'scenarios', 'catalog-browse.js'),
      'utf-8',
    )
    expect(content).toContain('catalog_error_rate')
    expect(content).toContain('COMMON_THRESHOLDS.catalog')
    expect(content).toContain('/api/categories')
    expect(content).toContain('/api/products')
  })

  it('memverifikasi skenario checkout memvalidasi ketiadaan server crash 500 pada persaingan stok', () => {
    const content = fs.readFileSync(
      path.join(loadTestDir, 'scenarios', 'checkout-concurrency.js'),
      'utf-8',
    )
    expect(content).toContain('checkout_server_errors')
    expect(content).toContain('checkout_orders_success')
    expect(content).toContain('checkout_orders_out_of_stock')
    expect(content).toContain('no server crash (status not 500)')
    expect(content).toContain('count==0')
  })

  it('memverifikasi skenario webhook Midtrans memiliki penanganan idempoten tanpa crash', () => {
    const content = fs.readFileSync(
      path.join(loadTestDir, 'scenarios', 'webhook-dedup.js'),
      'utf-8',
    )
    expect(content).toContain('generateMidtransSignature')
    expect(content).toContain('webhook_server_errors')
    expect(content).toContain('count==0')
    expect(content).toContain('/api/midtrans/notification')
  })

  it('memverifikasi skenario health & readiness memvalidasi polling telemetri', () => {
    const content = fs.readFileSync(
      path.join(loadTestDir, 'scenarios', 'health-readiness.js'),
      'utf-8',
    )
    expect(content).toContain('/api/health')
    expect(content).toContain('/api/ready')
    expect(content).toContain('health_error_rate')
  })

  it('memastikan seluruh berkas load test tidak melanggar batas 300 baris kode dan bebas em dash', () => {
    const allFiles = [
      path.join(loadTestDir, 'common.js'),
      path.join(loadTestDir, 'suite.js'),
      path.join(loadTestDir, 'runner.mjs'),
      ...scenarioFiles.map((f) => path.join(loadTestDir, 'scenarios', f)),
    ]

    for (const filePath of allFiles) {
      const code = fs.readFileSync(filePath, 'utf-8')
      const lines = code.split('\n')
      expect(
        lines.length,
        `Berkas ${path.basename(filePath)} melampaui batas 300 baris (${lines.length} baris)`,
      ).toBeLessThanOrEqual(300)
      expect(
        code.includes('\u2014'),
        `Berkas ${path.basename(filePath)} tidak boleh memuat em dash`,
      ).toBe(false)
    }
  })
})
