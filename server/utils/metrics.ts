export interface OperationalMetrics {
  requestsTotal: number
  requestsSuccess: number
  requestsClientError: number
  requestsServerError: number
  webhookTotal: number
  webhookSuccess: number
  webhookFailure: number
  refundTotal: number
  refundSuccess: number
  refundFailure: number
  reconciliationTotal: number
  reconciliationSuccess: number
  reconciliationFailure: number
  startedAt: string
}

const metricsState: OperationalMetrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsClientError: 0,
  requestsServerError: 0,
  webhookTotal: 0,
  webhookSuccess: 0,
  webhookFailure: 0,
  refundTotal: 0,
  refundSuccess: 0,
  refundFailure: 0,
  reconciliationTotal: 0,
  reconciliationSuccess: 0,
  reconciliationFailure: 0,
  startedAt: new Date().toISOString(),
}

export const metrics = {
  recordRequest(statusCode: number): void {
    metricsState.requestsTotal += 1
    if (statusCode >= 500) {
      metricsState.requestsServerError += 1
    } else if (statusCode >= 400) {
      metricsState.requestsClientError += 1
    } else {
      metricsState.requestsSuccess += 1
    }
  },

  recordWebhook(isSuccess: boolean): void {
    metricsState.webhookTotal += 1
    if (isSuccess) {
      metricsState.webhookSuccess += 1
    } else {
      metricsState.webhookFailure += 1
    }
  },

  recordRefund(isSuccess: boolean): void {
    metricsState.refundTotal += 1
    if (isSuccess) {
      metricsState.refundSuccess += 1
    } else {
      metricsState.refundFailure += 1
    }
  },

  recordReconciliation(isSuccess: boolean): void {
    metricsState.reconciliationTotal += 1
    if (isSuccess) {
      metricsState.reconciliationSuccess += 1
    } else {
      metricsState.reconciliationFailure += 1
    }
  },

  getSnapshot(): Readonly<OperationalMetrics> {
    return { ...metricsState }
  },

  reset(): void {
    metricsState.requestsTotal = 0
    metricsState.requestsSuccess = 0
    metricsState.requestsClientError = 0
    metricsState.requestsServerError = 0
    metricsState.webhookTotal = 0
    metricsState.webhookSuccess = 0
    metricsState.webhookFailure = 0
    metricsState.refundTotal = 0
    metricsState.refundSuccess = 0
    metricsState.refundFailure = 0
    metricsState.reconciliationTotal = 0
    metricsState.reconciliationSuccess = 0
    metricsState.reconciliationFailure = 0
    metricsState.startedAt = new Date().toISOString()
  },
}
