import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { getBaseUrl, createHeaders, COMMON_THRESHOLDS } from '../common.js'

export const healthErrorRate = new Rate('health_error_rate')
export const healthDurationTrend = new Trend('health_duration_ms')

export const options = {
  stages: [
    { duration: '3s', target: 10 },
    { duration: '10s', target: 20 }, // Polling cepat 20 VUs
    { duration: '3s', target: 0 },
  ],
  thresholds: {
    ...COMMON_THRESHOLDS.health,
    health_error_rate: ['rate<0.001'],
  },
}

export default function () {
  const baseUrl = getBaseUrl()
  const headers = createHeaders()

  // 1. Liveness Probe
  const healthRes = http.get(`${baseUrl}/api/health`, { headers })
  healthDurationTrend.add(healthRes.timings.duration)
  const healthOk = check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health body ok': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.status === 'ok' || body.status === 'success' || body.success === true
      } catch {
        return false
      }
    },
  })
  healthErrorRate.add(!healthOk)

  // 2. Readiness Probe
  const readyRes = http.get(`${baseUrl}/api/ready`, { headers })
  healthDurationTrend.add(readyRes.timings.duration)
  const readyOk = check(readyRes, {
    'ready status 200 or 503': (r) => [200, 503].includes(r.status),
    'ready returns valid json': (r) => {
      try {
        JSON.parse(r.body)
        return true
      } catch {
        return false
      }
    },
  })
  healthErrorRate.add(!readyOk)

  sleep(0.3)
}
