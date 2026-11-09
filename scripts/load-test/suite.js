import { sleep } from 'k6'
import catalogScenario, { options as catalogOptions } from './scenarios/catalog-browse.js'
import checkoutScenario, { options as checkoutOptions } from './scenarios/checkout-concurrency.js'
import webhookScenario, { options as webhookOptions } from './scenarios/webhook-dedup.js'
import healthScenario, { options as healthOptions } from './scenarios/health-readiness.js'

// Pilih opsi konfigurasi berdasarkan parameter SCENARIO
const selectedScenario =
  typeof __ENV !== 'undefined' && __ENV.SCENARIO ? __ENV.SCENARIO.toLowerCase() : 'all'

export const options = (() => {
  if (selectedScenario === 'catalog') return catalogOptions
  if (selectedScenario === 'checkout') return checkoutOptions
  if (selectedScenario === 'webhook') return webhookOptions
  if (selectedScenario === 'health') return healthOptions

  // Skenario gabungan untuk eksekusi komprehensif
  return {
    scenarios: {
      catalog_workload: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '3s', target: 5 },
          { duration: '10s', target: 10 },
          { duration: '3s', target: 0 },
        ],
        exec: 'runCatalog',
      },
      health_workload: {
        executor: 'constant-vus',
        vus: 5,
        duration: '16s',
        exec: 'runHealth',
      },
    },
    thresholds: {
      http_req_failed: ['rate<0.02'],
      http_req_duration: ['p(95)<800'],
    },
  }
})()

export function runCatalog() {
  catalogScenario()
}

export function runHealth() {
  healthScenario()
}

export default function () {
  if (selectedScenario === 'catalog') {
    catalogScenario()
  } else if (selectedScenario === 'checkout') {
    checkoutScenario()
  } else if (selectedScenario === 'webhook') {
    webhookScenario()
  } else if (selectedScenario === 'health') {
    healthScenario()
  } else {
    // Mode gabungan default jika tidak ada executor multi-skenario
    catalogScenario()
    sleep(0.5)
    healthScenario()
  }
}
