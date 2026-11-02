# Cart, Orders, and Midtrans Sandbox Design

## Goal

Deliver a complete customer checkout flow for ShelfStack: persistent cart, atomic order creation, Midtrans Snap Sandbox payment, verified payment webhook, order history, and realtime order status.

## Scope

- Persist cart items in browser local storage under `shelfstack-cart`.
- Create `orders` and `order_items` through Supabase migrations and an atomic `create_order` RPC.
- Create a Midtrans Snap transaction only after an authenticated user owns a pending order.
- Accept payment status only through a server webhook that verifies Midtrans's SHA-512 signature.
- Show customer order history, order detail, and realtime status changes.
- Provide an explicit Sandbox feature flag. Production payment activation remains disabled by default.

## Architecture

```text
Product detail -> cart store -> checkout form -> POST /api/orders
  -> Supabase create_order RPC (lock stock, calculate total, create order)
  -> POST /api/orders/:id/payment-token -> Midtrans Snap Sandbox
  -> Midtrans webhook -> signature verification -> order status update
  -> Supabase Realtime -> customer order page refreshes
```

The cart snapshot is only a display cache. The RPC reads the current `price_cents` and stock from `products`, locks matching rows, calculates the total, inserts both order tables, and decrements stock inside one transaction. The client never supplies a total price or transitions a payment status.

## Data Model and Authorization

`orders` stores a UUID, owner ID, `total_cents`, `pending|paid|shipped|completed|cancelled` status, delivery address JSON, optional Midtrans transaction ID, and timestamps. `order_items` stores the immutable product ID, quantity, and price at purchase.

RLS allows customers to read only their own orders and items. Customers cannot directly insert or update orders. The security-definer RPC is the only customer creation path and uses `auth.uid()` internally. Admin access follows the existing `is_admin()` policy pattern. Schema changes use one versioned Supabase migration only.

## Payment Flow

1. The customer submits validated cart and delivery address.
2. The API validates with the shared Zod checkout schema and calls `create_order` as that user.
3. The API returns the created order ID. A second authenticated endpoint creates one Midtrans Snap token for that pending order, using the order total stored in Supabase.
4. The frontend opens Snap using `NUXT_PUBLIC_MIDTRANS_CLIENT_KEY` and `NUXT_PUBLIC_MIDTRANS_SNAP_URL`.
5. Midtrans posts a notification to the webhook. The webhook calculates SHA-512 from `order_id`, `status_code`, `gross_amount`, and `MIDTRANS_SERVER_KEY`, rejects invalid signatures, maps supported transaction statuses, and updates the order once.
6. Order pages subscribe to their owner's `orders` changes and refresh data after an update.

The browser callback can show immediate feedback only. It must never mark an order paid.

## Configuration

The implementation uses only environment variables:

- `NUXT_PUBLIC_ENABLE_MIDTRANS_SANDBOX=false`
- `NUXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `NUXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_API_URL=https://app.sandbox.midtrans.com/snap/v1/transactions`

The server returns payment endpoints as unavailable when the feature flag is off. Keys are added to `.env.example` without values and never committed to `.env`.

## User Experience

- Product detail adds a chosen quantity to cart and opens the drawer.
- Cart supports quantity changes, removal, stock-aware validation, and checkout navigation.
- Checkout requires login and valid delivery fields before order creation.
- Order detail shows payment state, payment action while pending, and a status timeline.
- Error messages state whether cart stock, checkout input, payment setup, or payment confirmation failed.

## Testing and Evidence

Tests are test-first for cart persistence and totals, checkout schema validation, order API authorization, and webhook signature/status mapping. Integration and E2E coverage use Sandbox-safe test values and do not contact Production.

The final evidence includes a local recording of cart -> checkout -> Snap Sandbox -> verified webhook -> paid status, plus test output. No live payment, real credentials, or production Supabase instance is used.

## Explicit Exclusions

- Real payment activation, refunds, shipping fees, coupons, and invoice generation.
- Midtrans status changes initiated from the frontend.
- Admin order operations beyond read compatibility required by customer checkout; administrative status transitions remain Sprint 5.
