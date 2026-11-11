# Load Testing Suite — ShelfStack

## 1. Objective

Measure ShelfStack under realistic concurrency instead of claiming scalability without evidence. The suite exercises transactional integrity, inventory atomicity under race conditions, webhook deduplication, and observability endpoints.

## 2. Tool & Architecture

- **Tooling Engine**: Grafana k6 (v2.3.0) via cross-platform Node.js runner (`scripts/load-test/runner.mjs`).
- **Command Runner**: `pnpm test:load [scenario] [options]`.
- **Unit Suite Verification**: `tests/unit/load-test-suite.spec.ts` (8/8 tests passed).

## 3. Scenarios

### 3.1 Catalog Browsing (`scripts/load-test/scenarios/catalog-browse.js`)

Simulates realistic visitor browsing across the storefront:

- Fetch official categories (`GET /api/categories`)
- Paginated product catalog listing (`GET /api/products?page=1&limit=12`)
- Filter by category (`GET /api/products?category=tech`)
- Text search with debounce query (`GET /api/products?q=desk`)
- Sort by lowest price (`GET /api/products?sort=price-low`)
- **Thresholds**:
  - `catalog_error_rate`: `< 1%`
  - `http_req_duration`: `p(95) < 1000ms`, `p(99) < 2000ms`

### 3.2 Critical Inventory & Checkout Concurrency (`scripts/load-test/scenarios/checkout-concurrency.js`)

Validates transactional invariants when multiple virtual users (VUs) simultaneously attempt to purchase the exact same product SKU:

- Sends atomic request payloads with unique `Idempotency-Key` headers (RFC 4122 v4 UUID).
- Verifies PostgreSQL RPC `create_order` row-level lock (`SELECT ... FOR UPDATE`).
- **Invariants Enforced**:
  - `checkout_server_errors`: `count == 0` (server never crashes with HTTP 500 or deadlock).
  - Stock never becomes negative.
  - Successful orders never exceed available stock.
  - Excess requests gracefully receive HTTP 400 (Out of stock) or HTTP 401 (Unauthorized without session token).

### 3.3 Payment Webhook Deduplication & Concurrency (`scripts/load-test/scenarios/webhook-dedup.js`)

Validates payment webhook resilience against concurrent or duplicate deliveries (`POST /api/midtrans/notification`):

- Generates valid SHA-512 signatures using the configured Midtrans Server Key:
  `SHA512(order_id + status_code + gross_amount + server_key)`.
- Sends duplicate settlement payloads simultaneously.
- **Invariants Enforced**:
  - `webhook_server_errors`: `count == 0` (zero 500 crashes).
  - Handled cleanly with HTTP 200 or 404 (for synthetic test order ID).
  - Zero duplicate ledger mutations or corrupted order states.

### 3.4 Observability, Liveness & Readiness Probes (`scripts/load-test/scenarios/health-readiness.js`)

Verifies health probes under rapid polling without connection pool exhaustion:

- Liveness probe (`GET /api/health`).
- Readiness probe (`GET /api/ready`) monitoring PostgreSQL, Redis, and Order Service Fastify bridge.
- **Thresholds**:
  - `health_error_rate`: `< 0.1%`
  - `http_req_duration`: `p(95) < 200ms`, `p(99) < 500ms`

## 4. Execution Guide

```bash
# Jalankan seluruh skenario uji beban (default)
pnpm test:load

# Jalankan skenario tertentu
pnpm test:load catalog
pnpm test:load checkout
pnpm test:load webhook
pnpm test:load health

# Opsi kustom (VUs, durasi, URL target)
pnpm test:load catalog --vus 15 --duration 30s
pnpm test:load checkout --vus 20 --duration 15s --base-url http://localhost:3000

# Bantuan CLI
pnpm test:load --help
```

## 5. Measured Production Metrics

### 5.1 Authenticated Production Build Verification

Pengujian beban dieksekusi secara empiris pada server produksi Nitro (`node --env-file-if-exists=.env .output/server/index.mjs`) menggunakan Grafana k6 dengan injeksi cookie sesi autentikasi Supabase SSR (`sb-<projectRef>-auth-token`).

- **Catalog Browsing (`catalog`, 5 VUs, 10s)**:
  - **Throughput**: 5.95 req/s (total 75 HTTP requests, 15 iterasi selesai).
  - **Success Rate**: 100.00% (105/105 checks succeeded, 0% failure).
  - **Latency Profile**: min 123.52ms, median 282.59ms, avg 324.89ms, p90 455.52ms, p95 568.38ms, p99 691.33ms.
  - **Server Crash (500)**: 0.

- **Critical Inventory & Checkout Concurrency (`checkout`, 10 VUs, 10s, Authenticated)**:
  - **Target Product SKU**: Product ID 12 (`stock: 0`), menguji penguncian baris PostgreSQL RPC `create_order` (`SELECT ... FOR UPDATE`).
  - **Throughput**: 14.10 req/s (total 149 HTTP requests atomik berebut checkout SKU yang sama).
  - **Transactional Integrity**:
    - `checkout_unauthorized`: 0 (cookie sesi Supabase SSR valid 100%).
    - `checkout_server_errors`: 0 (count == 0, zero HTTP 500 crash / deadlock).
    - `checkout_orders_out_of_stock`: 149 (100% permintaan ditangani secara aman dengan HTTP 400 Out of Stock tanpa pembuatan unpaid junk order).
    - Invariant: Checks succeeded 100.00% (298/298 checks).
  - **Latency Profile**: min 124.60ms, median 164.98ms, avg 193.23ms, p90 328.06ms, p95 373.09ms, p99 494.14ms.

- **Payment Webhook Deduplication (`webhook`, 5 VUs, 5s)**:
  - **Throughput**: 5.29 req/s (total 30 HTTP requests, 60/60 checks passed).
  - **Idempotency & Resilience**:
    - `webhook_server_errors`: 0 (count == 0).
    - `webhook_failure_rate`: 0.00%.
  - **Latency Profile**: min 296.01ms, median 368.99ms, avg 415.82ms, p90 544.94ms, p95 651.15ms, p99 742.59ms.

- **Observability, Liveness & Readiness Probes (`health`, 5 VUs, 5s)**:
  - **Throughput**: 16.92 req/s (total 96 requests, 192/192 checks passed).
  - **Error Rate**: 0.00% (`health_error_rate == 0.00%`).
  - **Latency Profile**: min 0.85ms, median 85.54ms, avg 125.56ms, p90 331.85ms, p95 382.33ms, p99 497.42ms.
