# Order State Machine

## Purpose

Prevent arbitrary order state mutations.

## Candidate States

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

## Transition Design

Before implementation, inspect the existing order schema and code.

For every transition document:

- current state
- next state
- actor
- trigger
- side effects
- inventory effect
- payment effect
- notification effect

## Rules

Examples:

pending -> paid
pending -> cancelled
paid -> processing
processing -> packed
packed -> shipped
shipped -> delivered
delivered -> completed

Terminal states should not be overwritten by stale external events.

Do not implement a transition solely because it appears in this document.
The repository and business requirements remain authoritative.

## Testing

Every allowed transition should have a positive test.

Every important forbidden transition should have a negative test.
