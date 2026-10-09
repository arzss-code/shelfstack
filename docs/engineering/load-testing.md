# Load Testing

## Objective

Measure ShelfStack under realistic concurrency instead of claiming scalability
without evidence.

## Tool

Prefer k6 unless the repository already has an appropriate load-testing tool.

## Scenarios

### Catalog

- product listing
- search
- filtering
- sorting
- product detail

### Cart

- add item
- update quantity
- remove item

### Checkout

- normal checkout
- concurrent checkout for the same SKU

### Payment

- concurrent webhook delivery
- duplicate webhook delivery

## Critical Inventory Test

Example:

- initial stock = 10
- many concurrent checkout attempts for the same SKU

Expected:

- stock never becomes negative
- successful purchases never exceed available inventory
- cancellation/expiry restores inventory exactly once
- duplicate webhooks do not duplicate side effects

## Metrics

Measure:

- throughput
- p50
- p95
- p99
- error rate
- database behavior
- Redis behavior
- queue behavior

Do not use an arbitrary latency target as proof of production readiness.

Record:

- workload
- environment
- duration
- virtual users
- results
- bottlenecks
- limitations

## Definition of Done

Load tests are reproducible, results are recorded, concurrency invariants
hold, and no benchmark number is claimed without an actual measurement.
