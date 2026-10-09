# ShelfStack Production-Oriented Roadmap

## Phase A — Repository Audit

No code changes.

Establish the actual current architecture and identify discrepancies between
documentation and repository state.

## Phase B — Reliability Hardening

Implement:

- idempotency
- order state machine
- payment state machine
- webhook reliability
- cancellation/expiry correctness
- inventory consistency
- reconciliation

## Phase C — Security

Implement/review:

- authentication
- authorization
- ownership checks
- validation
- rate limiting
- security headers
- secret handling
- webhook security
- file upload security
- audit logging

## Phase D — Observability

Implement:

- structured logs
- correlation IDs
- useful metrics
- worker visibility
- health/readiness checks

Introduce additional observability infrastructure only when justified.

## Phase E — Load Testing

Implement reproducible k6 scenarios.

Prove:

- no overselling
- no duplicate inventory mutation
- acceptable latency under measured workload
- queue and database behavior under load

## Phase F — E-commerce Domain Completeness

Prioritize only after reliability foundations:

1. Product variants / SKU
2. Promotion / voucher
3. Shipping / fulfillment
4. Return
5. Refund
6. Notification
7. Analytics

## Phase G — Advanced Scale

Only if justified by actual workload:

- dedicated search service
- advanced event-driven architecture
- read replicas
- additional service decomposition
- distributed tracing infrastructure
- more advanced caching topology

Do not add infrastructure merely to make the architecture look impressive.
