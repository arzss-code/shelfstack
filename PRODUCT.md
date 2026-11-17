# Product Overview: ShelfStack

## Identity & Scope

**ShelfStack** is a production-oriented, curated single-vendor e-commerce platform built with Nuxt 4, Nitro, PostgreSQL (Supabase), Redis, BullMQ, and Midtrans Sandbox.

## Target Users

1. **Customers (Storefront)**: Browse curated catalog collections (`/katalog`, `/c/[slug]`), manage shopping carts and wishlists, apply vouchers and loyalty coins, complete checkout with Midtrans Sandbox payments, track shipping checkpoints (`/tracking`), submit 7-day return/RMA claims, print invoices/waybills, and contact support via Live Chat.
2. **Operations Administrators (`/admin`)**: Monitor executive KPIs and sales trends, fulfill orders and verify delivery checkpoints, manage product inventory and SKU variants with double-entry audit ledgers, review return requests, respond to live customer support threads, and monitor BullMQ expiry queues and DLQ replay.

## Product Purpose

Deliver a cohesive e-commerce experience combining clean editorial presentation on the storefront with transactional integrity on the backend: atomic PostgreSQL row locks (`FOR UPDATE`), explicit order/payment finite state machine separation, idempotent retry handling, and verifiable server-side pricing.

## Brand Personality

Clean, minimal, architectural, and content-first. Product imagery leads while neutral surfaces, crisp typography (`DM Sans`), and a restrained Electric Blue (`#0066ff`) commercial accent keep interactions legible and focused.

## Anti-References

- Decorative badges or fake urgency timers unrelated to active database campaigns.
- Dense cluttered forms with hidden validation rules or unstyled scrollbars.
- Misleading action labels or fake client-only submissions that do not persist or reach real handlers.

## Core Design Principles

1. **Transactional Truth**: Pricing, flash deals, coupons, loyalty coins, and stock are enforced server-side in PostgreSQL.
2. **Operational Efficiency**: Modular admin workflows minimize clicks while enforcing strict authorization and audit logging.
3. **Explicit UI Feedback**: Every flow renders clear `Idle`, `Loading`, `Success`, `Empty`, and `Error` states.
4. **Honest Boundaries**: Sandbox payment flows, demo credentials, logistics simulation, and browser-open notifications are labeled transparently.

## Accessibility & Inclusion

- WCAG 2.1 AA text contrast compliance across light and dark semantic tokens (`--brand-*`).
- Minimum 44x44px touch targets for mobile controls, dialogs, and password visibility toggles.
- Full keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`, Arrow keys in autocomplete) with visible focus rings and semantic landmarks.
