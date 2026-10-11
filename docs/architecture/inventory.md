# Inventory Architecture

## Current Direction

ShelfStack uses transactional PostgreSQL inventory mutation and an inventory
movement ledger.

## Core Invariants

Inventory must not become negative.

Inventory mutations must be atomic.

Every meaningful mutation should be auditable.

## Reservation Model

If reservation is introduced, distinguish:

- on_hand
- reserved
- available

Invariant:

available = on_hand - reserved

## Concurrency

When multiple product rows must be locked, use deterministic ordering.

Do not rely on application-side checks alone for overselling prevention.

## Ledger

A stock movement record should capture enough information to understand:

- product/SKU
- delta
- reason
- resulting balance
- timestamp
- relevant business reference where appropriate

## Testing

Test:

- successful checkout
- insufficient stock
- concurrent checkout
- cancellation
- expiry
- duplicate cancellation
- duplicate webhook
- ledger consistency
