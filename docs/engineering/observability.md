# Observability & Operational Readiness Runbook

## 1. Overview & Architecture

ShelfStack's observability system provides end-to-end traceability, structured logging, health verification, and operational signals across the multi-tier architecture without adding heavy external dependencies:

```
[ Client / Webhook ]
        │
        ▼
[ Nginx Gateway ]  ─── Generates / Propagates $request_id & logs with req_id
        │
        ├────────────────────────────────────┐
        ▼ (Port 3000)                        ▼ (Port 4000)
[ Nuxt 4 SSR Monolith ]             [ Fastify Order Service ]
  - server/middleware/request-context - Request ID validation & propagation
  - server/utils/logger.ts (JSON)     - Pino JSON Logger with redaction
  - server/utils/metrics.ts           - Health & Readiness (/health, /ready)
  - /api/health (Liveness)
  - /api/ready  (Readiness)
        │                                    │
        └─────────────────┬──────────────────┘
                          ▼
             [ Supabase / PostgreSQL ]
             [ Redis 7 In-Memory Cache ]
```

---

## 2. Structured Logging Standard

All server logs are emitted to standard output (`stdout`/`stderr`) as single-line JSON objects, compatible with container log collectors (Docker, Kubernetes fluentd, AWS CloudWatch, Datadog Agent, Google Cloud Logging).

### JSON Log Schema

| Field           | Type                  | Description                                                             |
| --------------- | --------------------- | ----------------------------------------------------------------------- |
| `timestamp`     | `string` (ISO 8601)   | Precise timestamp of the event (UTC)                                    |
| `level`         | `string`              | Log level: `info`, `warn`, `error`, `debug`                             |
| `service`       | `string`              | Origin service (`shelfstack-frontend` or `@shelfstack/order-service`)   |
| `environment`   | `string`              | Environment (`development`, `staging`, `production`)                    |
| `message`       | `string`              | Human-readable event description                                        |
| `requestId`     | `string` (UUID/Alpha) | Unique identifier for request tracing                                   |
| `correlationId` | `string`              | Correlation identifier across distributed services                      |
| `route`         | `string`              | HTTP endpoint path (e.g. `/api/checkout`, `/api/midtrans/notification`) |
| `method`        | `string`              | HTTP method (`GET`, `POST`, etc.)                                       |
| `statusCode`    | `number`              | HTTP status code returned to client                                     |
| `durationMs`    | `number`              | Processing duration in milliseconds                                     |
| `context`       | `object`              | Sanitized domain context (e.g. `orderId`, `status`)                     |
| `error`         | `object`              | Sanitized error object (stack trace omitted in production)              |

### Redaction Rules (Zero-Leak Guarantee)

The redaction engine recursively scans all logged data before emission:

- **Authorization & Tokens**: Bearer JWT tokens, basic auth credentials, and cookies are masked as `[REDACTED_JWT]` or `[REDACTED]`.
- **Infrastructure Keys**: `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, and internal secrets (`x-internal-secret`) are replaced with `[REDACTED]`.
- **Payment Signatures**: SHA-512 signatures (`signature_key`) and 128-character hashes are replaced with `[REDACTED_SHA512]`.
- **Customer PII**: Phone numbers (`phone`), complete customer addresses (`address`), and card numbers are masked as `[REDACTED]`.
- **Error Stacks**: Error stack traces are excluded in production environments to avoid leaking file paths and internal schema structures.

### Sanitized Log Example

```json
{
  "timestamp": "2026-10-09T05:30:12.450Z",
  "level": "info",
  "service": "shelfstack-frontend",
  "environment": "production",
  "message": "HTTP POST /api/checkout -> 200 (42ms)",
  "requestId": "c4b8e21a-637a-4c22-b9e7-f1295b9d318e",
  "correlationId": "c4b8e21a-637a-4c22-b9e7-f1295b9d318e",
  "route": "/api/checkout",
  "method": "POST",
  "statusCode": 200,
  "durationMs": 42
}
```

---

## 3. Request Tracing & Correlation ID

### Tracing Flow

1. **Nginx Ingress**: Evaluates or generates `$request_id`.
2. **Nuxt / Nitro**: Validates `x-request-id` header against `^[a-zA-Z0-9_-]{1,64}$`.
   - If invalid or absent, generates a fresh `crypto.randomUUID()`.
   - Attaches `requestId` and `correlationId` to `event.context`.
   - Appends `x-request-id` and `x-correlation-id` to the HTTP response headers.
3. **Downstream Fastify Microservice**:
   - Receives forwarded `X-Request-ID` from Nginx or Nuxt.
   - Echoes `x-request-id` and `x-correlation-id` in response headers.
4. **Client / Error Response**:
   - When an API request fails, the response includes `requestId`:
     ```json
     {
       "status": "error",
       "message": "Pesanan tidak ditemukan",
       "data": null,
       "errors": null,
       "requestId": "c4b8e21a-637a-4c22-b9e7-f1295b9d318e"
     }
     ```
   - This allows customer support or ops to search logs directly with `requestId`.

---

## 4. Health, Readiness, & Probes

ShelfStack strictly distinguishes **Liveness** from **Readiness**:

| Endpoint             | Probe Type | Purpose                          | Behavior                          | Status Codes             |
| -------------------- | ---------- | -------------------------------- | --------------------------------- | ------------------------ |
| `/healthz` (Nginx)   | Liveness   | Orchestrator process alive check | Routes to Nuxt `/api/health`      | 200 OK                   |
| `/api/health` (Nuxt) | Liveness   | Nuxt process check               | Fast, memory-only, no DB query    | 200 OK                   |
| `/health` (Fastify)  | Liveness   | Order service process check      | Fast, memory-only, no DB query    | 200 OK                   |
| `/readyz` (Nginx)    | Readiness  | Traffic routing readiness        | Routes to Nuxt `/api/ready`       | 200 OK / 503 Unavailable |
| `/api/ready` (Nuxt)  | Readiness  | Verifies database connectivity   | Bounded ping (3000ms max timeout) | 200 OK (Up) / 503 (Down) |
| `/api/health/ready`  | Readiness  | Alias for orchestrators          | Same as `/api/ready`              | 200 OK (Up) / 503 (Down) |
| `/ready` (Fastify)   | Readiness  | Verifies DB & Redis dependencies | Bounded ping (3000ms max timeout) | 200 OK (Up) / 503 (Down) |

### Readiness Failure Behavior (Zero Information Leak)

When database connectivity is disrupted or times out, readiness returns HTTP 503 without leaking raw SQL errors, credentials, or internal stack traces:

```json
{
  "status": "error",
  "message": "Service not ready: database dependency is unavailable",
  "data": {
    "status": "not_ready",
    "service": "shelfstack-frontend",
    "timestamp": "2026-10-09T05:32:00.000Z",
    "dependencies": {
      "database": "down"
    }
  }
}
```

---

## 5. Operational Signals & Metrics

ShelfStack maintains in-memory operational metrics for real-time health inspection:

- `requestsTotal`, `requestsSuccess`, `requestsClientError`, `requestsServerError`
- `webhookTotal`, `webhookSuccess`, `webhookFailure`
- `refundTotal`, `refundSuccess`, `refundFailure`
- `reconciliationTotal`, `reconciliationSuccess`, `reconciliationFailure`

### Telemetry Endpoint (Admin Only)

- **Path**: `GET /api/admin/metrics`
- **Security**: Server-enforced `requireAdmin(event)` guard. Returns 401 for unauthenticated and 403 for non-admin accounts.

### External Monitoring & APM Status

- **External Error Monitoring (e.g. Sentry, Datadog APM)**: `NEEDS MANUAL CONFIGURATION`
  - Integration options: Configure Sentry Nuxt module or Datadog tracer via server plugins.
- **Leaked Password Protection**: `NEEDS MANUAL CONFIGURATION`
  - Requires manual enablement in the Supabase Auth Dashboard under Security Settings.

---

## 6. Incident Triage Runbooks

### Runbook 1: Payment Webhook Failures (`/api/midtrans/notification`)

1. **Symptom**: Webhook returns 403 or 500, customer payment not updating.
2. **Investigation**:
   - Filter logs by `[Midtrans Webhook]` or `route="/api/midtrans/notification"`.
   - If log shows `Signature tidak valid`:
     - Verify `MIDTRANS_SERVER_KEY` in server environment matches the Midtrans Sandbox/Production dashboard.
     - Verify if order ID has a retry suffix (`-Rxxxxxx`) and confirm base UUID extraction.
   - If log shows `RPC handle_payment_webhook error`:
     - Check if order is in a terminal state (`delivered`, `cancelled`, `refunded`).
     - State machine enforces canonical transitions; duplicate webhooks for terminal orders are safely handled as idempotent no-ops.
3. **Resolution**:
   - Run manual status reconciliation via admin dashboard or `/api/orders/:id/check-payment-status` to re-synchronize order status directly from Midtrans.

### Runbook 2: Refund & Reconciliation Failures (`/api/orders/:id/refund`)

1. **Symptom**: Admin initiates refund; returns 422, 500, or stays pending.
2. **Investigation**:
   - Filter logs by `[Refund]` and search by `orderId` or `refundId`.
   - Midtrans operates a **2-Step Async Refund Flow**:
     - Step 1: Midtrans accepts request (`stage: accepted`). Order remains `paid` until bank confirms.
     - Step 2: Bank confirms settlement (`bank_confirmed_at`). Order transitions to `refunded`, and stock is restored.
   - If log shows `Gateway rejected refund request`:
     - Check Midtrans status code (e.g. 412: transaction not refundable, older than allowed window, or insufficient merchant balance).
3. **Resolution**:
   - Check Midtrans merchant portal for dispute or balance status.
   - Trigger status check `/api/orders/:id/check-payment-status` to fetch latest `bank_confirmed_at`.

### Runbook 3: Database Connectivity Degradation

1. **Symptom**: `/readyz` or `/api/ready` returns 503.
2. **Investigation**:
   - Inspect Supabase connection pool utilization in the Supabase project dashboard.
   - Check if database CPU or connection count reached the pool limit.
3. **Resolution**:
   - Verify connection pool mode (Transaction mode on port 6543 vs. Session mode on 5432).
   - Ensure serverless lambdas or dev processes are not leaking open pool connections.

---

## 7. Environment & Configuration Matrix

| Variable                          | Required In    | Description                                             |
| --------------------------------- | -------------- | ------------------------------------------------------- |
| `NODE_ENV`                        | All            | `development`, `test`, or `production`                  |
| `NUXT_PUBLIC_SUPABASE_URL`        | All            | Supabase project API URL                                |
| `NUXT_PUBLIC_SUPABASE_KEY`        | All            | Supabase anon key for public browser client             |
| `SUPABASE_SERVICE_ROLE_KEY`       | Staging / Prod | Secret service role key for backend-only RPC operations |
| `MIDTRANS_SERVER_KEY`             | Staging / Prod | Server key for Midtrans signature verification          |
| `NUXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Staging / Prod | Client key for Snap payment popup                       |
| `ORDER_SERVICE_URL`               | Prod           | Fastify microservice URL (`http://order-service:4000`)  |
| `REDIS_URL`                       | Prod           | Redis cache URL (`redis://redis:6379`)                  |

_Note: Never commit secret values to repository. All values must be supplied via runtime environment._
