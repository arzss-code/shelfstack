import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { getBaseUrl, createHeaders, generateUUID, COMMON_THRESHOLDS } from '../common.js'

export const checkoutOrdersSuccess = new Counter('checkout_orders_success')
export const checkoutOrdersOutOfStock = new Counter('checkout_orders_out_of_stock')
export const checkoutServerErrors = new Counter('checkout_server_errors')
export const checkoutDurationTrend = new Trend('checkout_duration_ms')
export const checkoutFailureRate = new Rate('checkout_failure_rate')

export const options = {
  stages: [
    { duration: '3s', target: 5 }, // Persiapan 5 VUs
    { duration: '12s', target: 15 }, // Lonjakan konkurensi 15 VUs berebut checkout SKU yang sama
    { duration: '3s', target: 0 }, // Selesai
  ],
  thresholds: {
    ...COMMON_THRESHOLDS.checkout,
    checkout_server_errors: ['count==0'], // Server dilarang crash 500 saat persaingan stok
  },
}

export default function () {
  const baseUrl = getBaseUrl()
  const idempotencyKey = generateUUID()
  const headers = createHeaders({
    'Idempotency-Key': idempotencyKey,
  })

  // Target item yang diperebutkan secara konkuren
  const targetProductId =
    typeof __ENV !== 'undefined' && __ENV.TARGET_PRODUCT_ID
      ? parseInt(__ENV.TARGET_PRODUCT_ID, 10)
      : 1

  const payload = JSON.stringify({
    items: [
      {
        product_id: targetProductId,
        qty: 1,
      },
    ],
    address: {
      recipient_name: 'Pelanggan Uji Konkurensi',
      phone_number: '081234567890',
      street_address: 'Jl. Sudirman Kav 21',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Setiabudi',
      postal_code: '12920',
    },
    shipping_service: 'reguler',
    courier_code: 'jne',
  })

  const res = http.post(`${baseUrl}/api/orders`, payload, { headers })
  checkoutDurationTrend.add(res.timings.duration)

  // Evaluasi invarian transaksional:
  // 1. Status 200/201: Pembelian berhasil, stok dikurangi atomik
  // 2. Status 400: Stok habis (anti-overselling bekerja sesuai ekspektasi)
  // 3. Status 401: Belum login / token absen (otorisasi bekerja)
  // 4. Status 409: Idempotency conflict tertangkap
  // 5. Status 500: Dilarang (indikasi unhandled deadlock atau crash database)
  const isHealthyResponse = res.status !== 500
  const isServerCrash = res.status >= 500

  if (isServerCrash) {
    checkoutServerErrors.add(1)
  }

  if (res.status === 200 || res.status === 201) {
    checkoutOrdersSuccess.add(1)
  } else if (res.status === 400) {
    checkoutOrdersOutOfStock.add(1)
  }

  check(res, {
    'no server crash (status not 500)': () => isHealthyResponse,
    'expected status code (200, 201, 400, 401, 409)': (r) =>
      [200, 201, 400, 401, 409].includes(r.status),
  })

  checkoutFailureRate.add(!isHealthyResponse)
  sleep(0.5)
}
