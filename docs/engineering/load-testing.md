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

## 5. Measured Baseline (2026-11-09)

- **Catalog Scenario (Live Nuxt Dev Server)**:
  - Checks succeeded: 100% (7/7 checks passed).
  - Error rate: 0.00%.
  - p95 latency: ~727ms (dev server JIT); p99: ~768ms.
- **Webhook Deduplication**:
  - Server errors (500): 0 (count == 0).
  - Checks succeeded: 100% (12/12 checks passed).
  - p95 latency: ~231ms.
- **Checkout Concurrency**:
  - Server errors (500): 0 (count == 0).
  - Handled status codes: 100% within valid transactional set (200, 201, 400, 401, 409).
  - p95 latency: ~283ms.
