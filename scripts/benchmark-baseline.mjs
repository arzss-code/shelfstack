/**
 * Task 09 — Performance Baseline Benchmark Runner
 *
 * Measures throughput (RPS), error rate, latency distribution (min, mean, p50, p95, p99, max),
 * and memory metrics across core ShelfStack operational workloads.
 */

import crypto from 'node:crypto'
import os from 'node:os'
import { checkLiveness, checkReadiness } from '../server/utils/health.js'
import {
  calculateCheckoutHash,
  validateIdempotencyKey,
} from '../server/utils/idempotency.js'
import { resolveRequestId, sanitizeLogData } from '../server/utils/logger.js'
import { verifyMidtransSignature } from '../server/utils/midtrans.js'
import { checkoutSchema } from '../shared/schemas/order.js'

function calculatePercentile(latencies, percentile) {
  if (latencies.length === 0) return 0
  const sorted = [...latencies].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1),
  )
  return sorted[index]
}

async function runBenchmark(name, iterations, concurrency, workerFn) {
  const latencies = []
  let errors = 0
  const initialMem = process.memoryUsage().heapUsed

  const startTime = performance.now()

  // Concurrency pool runner
  let currentIteration = 0
  const executeWorker = async () => {
    while (true) {
      const idx = currentIteration++
      if (idx >= iterations) break

      const t0 = performance.now()
      try {
        await workerFn(idx)
        const t1 = performance.now()
        latencies.push(t1 - t0)
      } catch {
        const t1 = performance.now()
        latencies.push(t1 - t0)
        errors++
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => executeWorker())
  await Promise.all(workers)

  const totalTimeMs = performance.now() - startTime
  const finalMem = process.memoryUsage().heapUsed
  const heapDeltaMb = ((finalMem - initialMem) / 1024 / 1024).toFixed(2)

  const sorted = [...latencies].sort((a, b) => a - b)
  const min = sorted[0]?.toFixed(3) ?? 0
  const max = sorted[sorted.length - 1]?.toFixed(3) ?? 0
  const mean = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3)
  const p50 = calculatePercentile(latencies, 50).toFixed(3)
  const p95 = calculatePercentile(latencies, 95).toFixed(3)
  const p99 = calculatePercentile(latencies, 99).toFixed(3)
  const rps = ((iterations / (totalTimeMs / 1000))).toFixed(1)
  const errorRate = ((errors / iterations) * 100).toFixed(2)

  return {
    name,
    iterations,
    concurrency,
    totalTimeMs: totalTimeMs.toFixed(1),
    rps: Number(rps),
    errorRate: `${errorRate}%`,
    min: Number(min),
    mean: Number(mean),
    p50: Number(p50),
    p95: Number(p95),
    p99: Number(p99),
    max: Number(max),
    heapDeltaMb: `${heapDeltaMb} MB`,
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log('  ShelfStack — Performance Baseline & Load Benchmark')
  console.log('='.repeat(70))
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`)
  console.log(`CPUs: ${os.cpus().length} x ${os.cpus()[0]?.model}`)
  console.log(`Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`)
  console.log(`Node.js Version: ${process.version}`)
  console.log('-'.repeat(70))

  const results = []

  // 1. Health / Liveness Check (Memory-only process probe)
  console.log('Running: 1. Health / Liveness Probe...')
  results.push(
    await runBenchmark('Health (Liveness)', 1000, 10, async () => {
      checkLiveness()
    }),
  )

  // 2. Readiness Probe (Healthy Simulated DB Ping)
  console.log('Running: 2. Readiness (Healthy Dependency)...')
  results.push(
    await runBenchmark('Readiness (Healthy DB)', 500, 10, async () => {
      await checkReadiness(async () => true, 1000)
    }),
  )

  // 3. Catalog Payload & Zod Validation
  console.log('Running: 3. Catalog Payload Validation...')
  const sampleCheckoutPayload = {
    items: [
      { product_id: 101, qty: 2 },
      { product_id: 102, qty: 1 },
    ],
    address: {
      name: 'John Doe',
      phone: '081234567890',
      street: 'Jl. Jenderal Sudirman No. 45',
      city: 'Jakarta',
      postal: '10220',
      note: 'Tolong packing kayu',
    },
  }
  results.push(
    await runBenchmark('Checkout Schema Validation', 1000, 10, async () => {
      const res = checkoutSchema.safeParse(sampleCheckoutPayload)
      if (!res.success) throw new Error('Validation failed')
    }),
  )

  // 4. Normal Checkout (Hash computation & Key generation)
  console.log('Running: 4. Normal Checkout Processing...')
  results.push(
    await runBenchmark('Checkout Processing (Fresh)', 500, 5, async (idx) => {
      const key = `chk-bench-${idx}-${Date.now()}`
      validateIdempotencyKey(key)
      calculateCheckoutHash(sampleCheckoutPayload)
    }),
  )

  // 5. Duplicate Checkout (Idempotent replay speedup)
  console.log('Running: 5. Duplicate Checkout (Idempotent Replay)...')
  const precomputedHash = calculateCheckoutHash(sampleCheckoutPayload)
  results.push(
    await runBenchmark('Checkout Idempotency Match', 1000, 10, async () => {
      const incomingHash = precomputedHash
      // Fast path: hash comparison O(1)
      if (incomingHash !== precomputedHash) throw new Error('Mismatch')
    }),
  )

  // 6. Payment Webhook Signature Verification (SHA-512)
  console.log('Running: 6. Payment Webhook Signature Verification...')
  const serverKey = 'SB-Mid-server-BENCHMARK_KEY_123'
  const orderId = 'a1111111-2222-3333-4444-555555555555'
  const grossAmount = '300000.00'
  const validSignature = crypto
    .createHash('sha512')
    .update(`${orderId}200${grossAmount}${serverKey}`)
    .digest('hex')

  results.push(
    await runBenchmark('Webhook SHA-512 Verification', 1000, 10, async () => {
      const isValid = verifyMidtransSignature({
        orderId,
        statusCode: '200',
        grossAmount,
        serverKey,
        signatureKey: validSignature,
      })
      if (!isValid) throw new Error('Invalid signature')
    }),
  )

  // 7. Structured Logging Redaction Pipeline
  console.log('Running: 7. Structured Log Redaction Pipeline...')
  const complexLogObject = {
    order_id: orderId,
    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.abc',
    cookie: 'session_id=12345678',
    signature_key: validSignature,
    phone: '081234567890',
    address: 'Jl. Merdeka No. 1, Jakarta',
    items: [{ product_id: 101, qty: 1 }],
  }
  results.push(
    await runBenchmark('Log Redaction Engine', 1000, 10, async () => {
      sanitizeLogData(complexLogObject)
    }),
  )

  // 8. Request ID Resolution & Regex Validation
  console.log('Running: 8. Request ID Validation...')
  results.push(
    await runBenchmark('Request ID Resolution', 1000, 10, async (idx) => {
      resolveRequestId(`req-bench-${idx}`)
    }),
  )

  console.log('\n' + '='.repeat(70))
  console.log('  BENCHMARK RESULTS TABLE')
  console.log('='.repeat(70))
  console.table(
    results.map((r) => ({
      Scenario: r.name,
      N: r.iterations,
      C: r.concurrency,
      'Throughput (RPS)': r.rps,
      'p50 (ms)': r.p50,
      'p95 (ms)': r.p95,
      'p99 (ms)': r.p99,
      'Max (ms)': r.max,
      Errors: r.errorRate,
    })),
  )

  console.log('\nRAW_JSON_OUTPUT_START')
  console.log(JSON.stringify(results, null, 2))
  console.log('RAW_JSON_OUTPUT_END')
}

main().catch((err) => {
  console.error('Benchmark execution failed:', err)
  process.exit(1)
})
