# Product: ShelfStack

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Customers (Storefront)**: Browse curated catalog collections (`/katalog`, `/c/[slug]`), manage shopping carts and wishlists (`/wishlist`), apply vouchers and loyalty coins, complete checkout with Midtrans Sandbox payments, track shipping checkpoints (`/tracking`), submit 7-day return/RMA claims, print invoices/waybills, and contact support via Live Chat.
2. **Operations Administrators (`/admin`)**: Monitor executive KPIs and sales trends, fulfill orders and verify delivery checkpoints, manage product inventory and SKU variants with double-entry audit ledgers, review return requests, respond to live customer support threads, and monitor BullMQ expiry queues and DLQ replay.

## Product Purpose

Deliver a cohesive single-vendor e-commerce experience combining clean, content-first shopping flows on the storefront with production-grade transactional integrity on the backend: atomic PostgreSQL row locks (`FOR UPDATE`), explicit order and payment state machine separation, idempotent webhook and retry handling, and server-authoritative pricing.

## Positioning

Unlike generic storefront mockups or purely client-side templates, ShelfStack pairs a curated single-vendor catalog with real backend commerce invariants: PostgreSQL as the single source of truth for inventory (`on_hand`, `reserved`, `available`), order state, and payment state, backed by BullMQ delayed expiry queues with DLQ replay and real Midtrans Sandbox integration (no mock payment layer).

## Operating Context

- **Storefront & Account Flows**: Web storefront and customer account workspace (`/account/*`, `/orders`, `/wishlist`, `/cart`, `/checkout`, `/tracking`) used across mobile (320px to 430px) and desktop viewports in light and dark themes.
- **Admin Operations**: Dedicated `/admin` operational workspace enforcing server-side admin RBAC, double-entry stock movement logs, printable A6 thermal waybills and official invoices, and live support inbox triage.
- **Engineering & Verification Context**: Nuxt 4, Nitro, TypeScript, Supabase/PostgreSQL, Redis, BullMQ (`@shelfstack/order-service`), Fastify, Vitest, Playwright, and GitHub Actions CI.

## Capabilities and Constraints

- **Authoritative Server Boundaries**: Frontend is never authoritative for price, stock, payment state, user role, or permissions; all mutations validate at server boundaries with Zod and enforce soft deletes (`deleted_at`) on transactional data.
- **Payment & Logistics Boundaries**: Midtrans runs in Sandbox mode (no mock layer in code); shipping checkpoints and browser-open notifications are simulated and must remain labeled transparently.
- **Anti-References**: No decorative badges or fake urgency timers unrelated to active database campaigns; no dense cluttered forms with hidden validation rules; no misleading client-only controls that fail to persist or reach real handlers.

## Brand Commitments

- **Name**: ShelfStack.
- **Voice & Character**: Clean, restrained, architectural, and content-first. Clear Indonesian commerce copy without marketing fluff or developer/terminal jargon on consumer-facing surfaces.

## Evidence on Hand

- **Catalog & Seed Data**: 25 curated local products across 5 categories (`server/api/internal/seed-catalog.post.ts`, `server/utils/seed-catalog-data.ts`, `supabase/seed.sql`) with local assets in `public/images/products/`.
- **Demo Reviews & Sandbox Flows**: Demo reviewer accounts and seeded reviews, Midtrans Sandbox payment integration, and simulated logistics checkpoints.
- **Absences (Do Not Fabricate)**: No real production customer counts, no real customer testimonials, no external compliance certifications, and no fabricated performance benchmarks.

## Product Principles

1. **Transactional Truth**: Pricing, flash deals, coupons, loyalty coins, and stock are enforced server-side in PostgreSQL.
2. **Operational Efficiency**: Modular storefront and admin workflows minimize clicks while enforcing strict authorization and audit logging.
3. **Explicit UI Feedback**: Every data-driven view renders clear Idle, Loading, Success, Empty, and Error states.
4. **Honest Boundaries**: Sandbox payments, demo credentials, seeded reviews, and simulated logistics are always labeled transparently.

## Accessibility & Inclusion

- WCAG 2.1 AA text contrast compliance across light and dark semantic tokens (`--brand-*`).
- Minimum 44x44px touch targets for mobile controls, dialogs, and icon actions.
- Full keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`, Arrow keys in autocomplete/selects) with visible focus rings and semantic landmarks.
