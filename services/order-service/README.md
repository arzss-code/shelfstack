# @shelfstack/order-service

High-performance, standalone microservice pilot for ShelfStack order lifecycle and payment webhook processing.

## Tech Stack

- **Runtime**: Node.js (ESM, TypeScript NodeNext)
- **Framework**: Fastify 5 + `fastify-type-provider-zod`
- **Validation**: Zod (strict request & env validation)
- **Database**: Supabase PostgreSQL (`handle_payment_webhook` atomic RPC)
- **Logger**: Pino (JSON structured logging)
- **Testing**: Vitest (`app.inject()` integration testing)

## API Endpoints

### 1. Health Check

- **Endpoint**: `GET /health`
- **Response**:

```json
{
  "status": "success",
  "message": "Order service is healthy",
  "data": {
    "service": "@shelfstack/order-service",
    "uptime": 12.34,
    "timestamp": "2026-10-08T04:30:00.000Z",
    "environment": "development",
    "nodeVersion": "v22.x.x"
  }
}
```

### 2. Midtrans Webhook Notification

- **Endpoint**: `POST /api/v1/orders/webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:

```json
{
  "order_id": "a0000000-0000-0000-0000-000000000001",
  "status_code": "200",
  "gross_amount": "150000.00",
  "signature_key": "sha512_hash...",
  "transaction_status": "settlement",
  "payment_type": "bank_transfer",
  "transaction_id": "midtrans-uuid"
}
```

- **Responses**:
  - `200 OK`: `{ "status": "success", "message": "Status pesanan berhasil diproses", "data": ... }`
  - `400 Bad Request`: `{ "status": "error", "message": "Validasi data gagal", ... }`
  - `403 Forbidden`: `{ "status": "error", "message": "Signature tidak valid. Akses webhook ditolak.", ... }`

## Development Scripts

```bash
# Run dev server with hot reload
pnpm --filter @shelfstack/order-service dev

# Run integration tests
pnpm --filter @shelfstack/order-service test

# Typecheck TypeScript
pnpm --filter @shelfstack/order-service typecheck

# Build for production
pnpm --filter @shelfstack/order-service build
```
