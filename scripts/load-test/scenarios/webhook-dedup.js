import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import {
  getBaseUrl,
  createHeaders,
  getMidtransServerKey,
  generateMidtransSignature,
  COMMON_THRESHOLDS,
} from '../common.js'

export const webhookProcessedCount = new Counter('webhook_processed_count')
export const webhookServerErrors = new Counter('webhook_server_errors')
export const webhookDurationTrend = new Trend('webhook_duration_ms')
export const webhookFailureRate = new Rate('webhook_failure_rate')

export const options = {
  stages: [
    { duration: '3s', target: 5 },
    { duration: '12s', target: 12 }, // Kirim notifikasi webhook ganda serentak
    { duration: '3s', target: 0 },
  ],
  thresholds: {
    ...COMMON_THRESHOLDS.webhook,
    webhook_server_errors: ['count==0'], // Webhook tidak boleh menghasilkan 500 saat diduplikasi
  },
}

export default function () {
  const baseUrl = getBaseUrl()
  const serverKey = getMidtransServerKey()
  const headers = createHeaders()

  // Target order ID deterministik untuk simulasi pengiriman notifikasi ganda
  const targetOrderId =
    typeof __ENV !== 'undefined' && __ENV.TARGET_ORDER_ID
      ? __ENV.TARGET_ORDER_ID
      : 'SS-ORDER-LOADTEST-001'

  const statusCode = '200'
  const grossAmount = '350000.00'
  const transactionStatus = 'settlement'

  const signature = generateMidtransSignature(targetOrderId, statusCode, grossAmount, serverKey)

  const payload = JSON.stringify({
    order_id: targetOrderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
    transaction_status: transactionStatus,
    fraud_status: 'accept',
    payment_type: 'qris',
    transaction_id: 'midtrans-trx-loadtest-12345',
  })

  const res = http.post(`${baseUrl}/api/midtrans/notification`, payload, { headers })
  webhookDurationTrend.add(res.timings.duration)

  const isServerCrash = res.status >= 500
  if (isServerCrash) {
    webhookServerErrors.add(1)
  }

  // Webhook yang sah harus mengembalikan 200 (atau 404/403 jika order tidak ditemukan di db uji)
  // namun dilarang keras menghasilkan 500 crash server
  const isHealthy = res.status !== 500
  if (isHealthy) {
    webhookProcessedCount.add(1)
  }

  check(res, {
    'webhook no 500 crash': () => isHealthy,
    'webhook handled cleanly': (r) => [200, 400, 403, 404].includes(r.status),
  })

  webhookFailureRate.add(!isHealthy)
  sleep(0.5)
}
