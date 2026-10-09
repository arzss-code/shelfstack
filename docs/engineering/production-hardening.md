# Production Hardening

## Objective

Strengthen ShelfStack's correctness and reliability before adding more
e-commerce features.

Priority:

1. Idempotency
2. Order state machine
3. Payment state machine
4. Payment webhook reliability
5. Inventory consistency
6. Cancellation/expiry consistency
7. Payment reconciliation

## Current Baseline

The existing ShelfStack design already uses PostgreSQL transactions,
row-level locking, deterministic product lock ordering, Midtrans webhook
handling, and an inventory movement ledger.

Do not assume every documented control is already implemented. Verify the
repository before changing code.

## Requirements

### 1. Idempotency

Identify duplicate-prone operations:

- order creation
- payment initiation
- webhook processing
- cancellation
- refund

Implement idempotency where appropriate.

The same logical request submitted multiple times must not create duplicate
business side effects.

### 2. Order State Machine

Define explicit allowed transitions.

Suggested states:

- pending
- paid
- processing
- packed
- shipped
- delivered
- completed
- cancelled
- returned
- refunded

Do not implement states that the current business requirements do not need
without documenting the reason.

### 3. Payment State Machine

Keep payment state separate from order state.

Suggested payment states:

- pending
- paid
- failed
- expired
- refunded
- partially_refunded

Map external Midtrans states into the internal payment model explicitly.

### 4. Webhook Reliability

Webhook handling must:

- verify the notification signature
- identify the order safely
- tolerate duplicate delivery
- tolerate retries
- reject or safely ignore stale transitions
- prevent double inventory restoration
- preserve terminal states
- record sufficient audit information

Where appropriate, support reconciliation/fallback status checks.

### 5. Inventory Consistency

All stock mutation must be transactional.

If reservation is introduced, maintain:

available = on_hand - reserved

Inventory movement history must remain auditable.

### 6. Cancellation and Expiry

Cancellation/expiry must be safe when racing with payment.

Required scenarios:

- cancel before payment
- payment before cancel
- webhook after cancel
- expiry after payment
- repeated cancellation
- repeated expiry
- duplicate webhook

### 7. Testing

Add tests for:

- duplicate webhook
- duplicate order request
- invalid order transition
- invalid payment transition
- payment after cancellation
- expiry after payment
- cancellation after payment
- repeated cancellation
- concurrent checkout
- repeated webhook delivery

Concurrency-sensitive tests should use real PostgreSQL where practical.

## Definition of Done

- Critical state transitions are explicit.
- Duplicate operations do not duplicate side effects.
- Payment webhook is idempotent.
- Cancellation/expiry cannot double-restock.
- Inventory remains transactionally consistent.
- Tests cover race-prone paths.
- Actual tests have been executed and results reported.
