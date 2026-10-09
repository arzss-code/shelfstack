# Payment State Machine

## Purpose

Keep payment lifecycle independent from order lifecycle.

## Candidate States

- pending
- paid
- failed
- expired
- refunded
- partially_refunded

## External Gateway

Midtrans is an external payment system.

Webhook events are considered at-least-once and may be retried.

Therefore:

- verify signature
- deduplicate events
- validate current state
- make side effects idempotent
- record relevant gateway identifiers
- safely handle stale events

## Reconciliation

Where appropriate, use gateway status retrieval as a fallback when webhook
delivery is uncertain.

## Testing

Cover:

- duplicate webhook
- out-of-order webhook
- invalid signature
- payment after cancellation
- expiry after payment
- repeated payment notification
- refund
- partial refund if supported
