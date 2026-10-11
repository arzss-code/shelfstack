import { checkLiveness } from '../utils/health'

export default defineEventHandler(() => {
  const telemetry = checkLiveness()
  return {
    status: 'success',
    message: 'ShelfStack Frontend is live',
    data: telemetry,
  }
})
