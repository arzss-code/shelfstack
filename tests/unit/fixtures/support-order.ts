import { vi } from 'vitest'
import { createError } from 'h3'
import type { Database } from '../../../app/types/database.types'

type Row = Record<string, unknown>
type Table = 'orders' | 'support_threads' | 'support_messages' | 'products'
type Operation = { table: Table; action: 'select' | 'insert' | 'update'; values?: Row }
export const customerId = '11111111-1111-4111-8111-111111111111'
export const foreignId = '22222222-2222-4222-8222-222222222222'
export const orderId = '550e8400-e29b-41d4-a716-446655440000'
export const otherOrderId = '660e8400-e29b-41d4-a716-446655440000'
const timestamp = '2026-11-17T00:00:00Z'
export const ownOrder = {
  id: orderId,
  user_id: customerId,
  total_cents: 125000,
  status: 'paid',
  created_at: timestamp,
} satisfies Pick<
  Database['public']['Tables']['orders']['Row'],
  'id' | 'user_id' | 'total_cents' | 'status' | 'created_at'
>
export const orderCard = {
  id: orderId,
  order_number: 'ORD-550E8400',
  total_cents: 125000,
  status: 'paid',
}
export const threadRow = (attachment: string | null = null): Row => ({
  id: 'thread-1',
  customer_id: customerId,
  attached_order_id: attachment,
  attached_product_id: null,
  status: 'open',
  deleted_at: null,
})
export const messageRow = (
  attachmentType: string | null = 'order_card',
  text = 'Pesanan saya',
): Row => ({
  id: 'message-1',
  thread_id: 'thread-1',
  sender_type: 'customer',
  sender_id: customerId,
  message_text: text,
  attachment_type: attachmentType,
  attachment_url: null,
  created_at: timestamp,
  deleted_at: null,
  is_read: false,
})

export function database() {
  const rows: Record<Table, Row[]> = {
    orders: [{ ...ownOrder }],
    support_threads: [],
    support_messages: [],
    products: [],
  }
  const operations: Operation[] = []
  const mutations: Operation[] = []
  const orderQueries: Array<{ columns: string[]; filters: Array<[string, unknown]> }> = []
  let orderFailure: 'returned' | 'thrown' | null = null
  const from = vi.fn((table: Table) => {
    const operation: Operation = { table, action: 'select' }
    const filters: Array<[string, unknown]> = []
    let columns = '*'
    let head = false
    let singular = false
    const execute = async () => {
      operations.push({ ...operation })
      if (table === 'orders' && orderFailure) {
        const internal = {
          message: 'private orders SQL diagnostic',
          details: 'private query plan',
          code: '42703',
        }
        if (orderFailure === 'thrown')
          throw createError({ statusCode: 503, message: internal.message, data: internal })
        return { data: { ...ownOrder }, error: internal, count: null }
      }
      if (table === 'orders') {
        const selectedColumns =
          columns === '*'
            ? Object.keys(ownOrder)
            : columns.split(',').map((column) => column.trim())
        orderQueries.push({ columns: selectedColumns, filters: [...filters] })
        const queriedColumns = [...selectedColumns, ...filters.map(([column]) => column)]
        const unknownColumn = queriedColumns.find((column) => !Object.hasOwn(ownOrder, column))
        if (unknownColumn) {
          return {
            data: null,
            error: { message: `Unknown orders column: ${unknownColumn}`, code: '42703' },
            count: null,
          }
        }
      }
      let matches = rows[table].filter((row) => filters.every(([key, value]) => row[key] === value))
      if (operation.action === 'insert') {
        const row = {
          id: `${table}-${rows[table].length + 1}`,
          deleted_at: null,
          created_at: timestamp,
          ...operation.values,
        }
        rows[table].push(row)
        matches = [row]
      } else if (operation.action === 'update') {
        matches.forEach((row) => Object.assign(row, operation.values))
      }
      const selected = matches.map((row) =>
        columns === '*'
          ? { ...row }
          : Object.fromEntries(
              columns.split(',').map((column) => [column.trim(), row[column.trim()]]),
            ),
      )
      return {
        data: head ? null : singular ? (selected[0] ?? null) : selected,
        error: null,
        count: matches.length,
      }
    }
    const query = {
      select(value = '*', options?: { head?: boolean }) {
        columns = value
        head = options?.head ?? false
        return query
      },
      eq(key: string, value: unknown) {
        filters.push([key, value])
        return query
      },
      is(key: string, value: null) {
        filters.push([key, value])
        return query
      },
      insert(values: Row) {
        operation.action = 'insert'
        operation.values = values
        mutations.push({ ...operation })
        return query
      },
      update(values: Row) {
        operation.action = 'update'
        operation.values = values
        mutations.push({ ...operation })
        return query
      },
      order() {
        return query
      },
      limit() {
        return query
      },
      maybeSingle() {
        singular = true
        return execute()
      },
      single() {
        singular = true
        return execute()
      },
      then<TResult1 = Awaited<ReturnType<typeof execute>>, TResult2 = never>(
        onfulfilled?:
          ((value: Awaited<ReturnType<typeof execute>>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return execute().then(onfulfilled, onrejected)
      },
    }
    return query
  })
  return {
    rows,
    operations,
    mutations,
    orderQueries,
    from,
    failOrders(mode: typeof orderFailure) {
      orderFailure = mode
    },
  }
}
