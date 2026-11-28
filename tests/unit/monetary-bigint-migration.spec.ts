import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { calculateCouponDiscountCents } from '../../shared/utils/coupon-math'

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations')

function readOrderedMigrations(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(resolve(MIGRATIONS_DIR, name), 'utf8'),
    }))
}

function extractLatestFunctionBody(
  migrations: Array<{ name: string; sql: string }>,
  fnName: string,
): { file: string; block: string } | null {
  let latest: { file: string; block: string } | null = null
  const pattern = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${fnName}\\s*\\([\\s\\S]*?\\$\\$;`,
    'gi',
  )
  for (const mig of migrations) {
    const matches = mig.sql.match(pattern)
    if (matches && matches.length > 0) {
      latest = { file: mig.name, block: matches[matches.length - 1] ?? '' }
    }
  }
  return latest
}

describe('Monetary Cents Bigint Schema & RPC Overflow Invariants', () => {
  it('widens all monetary _cents and coupon value columns to bigint in migrations', () => {
    const combinedSql = readOrderedMigrations()
      .map((m) => m.sql)
      .join('\n')

    const expectedAlterations: Array<[string, string]> = [
      ['products', 'price_cents'],
      ['product_variants', 'price_cents'],
      ['flash_deals', 'promo_price_cents'],
      ['coupons', 'discount_value'],
      ['coupons', 'max_discount_cents'],
      ['coupons', 'min_purchase_cents'],
      ['coupon_usages', 'discount_cents'],
      ['orders', 'total_cents'],
      ['orders', 'subtotal_cents'],
      ['orders', 'discount_cents'],
      ['orders', 'shipping_cost_cents'],
      ['order_items', 'price_cents'],
      ['refunds', 'amount_cents'],
      ['return_requests', 'refund_amount_cents'],
    ]

    for (const [table, column] of expectedAlterations) {
      const regex = new RegExp(
        `alter\\s+table\\s+(?:if\\s+exists\\s+)?public\\.${table}[\\s\\S]*?alter\\s+column\\s+${column}\\s+type\\s+bigint`,
        'i',
      )
      expect(regex.test(combinedSql), `Expected bigint migration for ${table}.${column}`).toBe(true)
    }
  })

  it('uses bigint locals and numeric percentage multiplication in latest create_order RPC', () => {
    const migrations = readOrderedMigrations()
    const latestCreateOrder = extractLatestFunctionBody(migrations, 'create_order')
    expect(latestCreateOrder).not.toBeNull()

    const sql = latestCreateOrder!.block
    const monetaryVars = [
      'v_subtotal',
      'v_discount',
      'v_subtotal_after_coupon',
      'v_total',
      'v_price',
      'v_variant_price',
      'v_item_price',
      'v_flash_promo_price',
      'v_shipping_cost',
    ]

    for (const varName of monetaryVars) {
      expect(sql).toMatch(new RegExp(`\\b${varName}\\s+bigint\\b`, 'i'))
      expect(sql).not.toMatch(new RegExp(`\\b${varName}\\s+int(?:eger|4)?\\b`, 'i'))
    }

    expect(sql).toMatch(/v_subtotal::numeric\s*\*\s*v_coupon\.discount_value::numeric/i)
  })

  it('updates sync_price_cents, admin_review_return_request, and handle_refund_webhook to bigint', () => {
    const migrations = readOrderedMigrations()

    const latestSync = extractLatestFunctionBody(migrations, 'sync_price_cents')
    expect(latestSync).not.toBeNull()
    expect(latestSync!.block).toMatch(/::bigint/i)
    expect(latestSync!.block).not.toMatch(/::int\b/i)

    const latestRma = extractLatestFunctionBody(migrations, 'admin_review_return_request')
    expect(latestRma).not.toBeNull()
    expect(latestRma!.block).toMatch(/p_refund_amount_cents\s+bigint/i)
    expect(latestRma!.block).toMatch(/v_refund_cents\s+bigint/i)

    const latestWebhook = extractLatestFunctionBody(migrations, 'handle_refund_webhook')
    expect(latestWebhook).not.toBeNull()
    expect(latestWebhook!.block).toMatch(/p_refund_amount_cents\s+bigint/i)
  })

  it('computes coupon discounts accurately above int4 range (> Rp 21.474.836)', () => {
    const largeSubtotalCents = 112_000_000 // Rp 1.120.000 (where 25% * subtotal overflows int4)
    const twentyFivePercent = {
      discount_type: 'percentage' as const,
      discount_value: 25,
      max_discount_cents: 50_000_000,
      min_purchase_cents: 10_000_000,
    }
    expect(calculateCouponDiscountCents(twentyFivePercent, largeSubtotalCents)).toBe(28_000_000)

    const hugeSubtotalCents = 3_000_000_000 // Rp 30.000.000 (exceeds int4 max 2_147_483_647)
    expect(
      calculateCouponDiscountCents(
        { ...twentyFivePercent, max_discount_cents: null },
        hugeSubtotalCents,
      ),
    ).toBe(750_000_000)
  })
})
