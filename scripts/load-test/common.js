import crypto from 'k6/crypto'

export const getBaseUrl = () => {
  if (typeof __ENV !== 'undefined' && __ENV.BASE_URL) {
    return __ENV.BASE_URL.replace(/\/+$/, '')
  }
  return 'http://localhost:3000'
}

export const getAuthToken = () => {
  if (typeof __ENV !== 'undefined' && __ENV.AUTH_TOKEN) {
    return __ENV.AUTH_TOKEN
  }
  return ''
}

export const getAuthCookie = () => {
  if (typeof __ENV !== 'undefined' && __ENV.AUTH_COOKIE) {
    return __ENV.AUTH_COOKIE
  }
  return ''
}

export const getMidtransServerKey = () => {
  if (typeof __ENV !== 'undefined' && __ENV.MIDTRANS_SERVER_KEY) {
    return __ENV.MIDTRANS_SERVER_KEY
  }
  return 'SB-Mid-server-test-key'
}

export const generateUUID = () => {
  const bytes = crypto.randomBytes(16)
  const hex = []
  for (let i = 0; i < 16; i++) {
    const byte = bytes[i]
    let h = (byte & 0xff).toString(16)
    if (h.length === 1) h = '0' + h
    hex.push(h)
  }
  // RFC 4122 version 4
  hex[6] = ((parseInt(hex[6], 16) & 0x0f) | 0x40).toString(16)
  hex[8] = ((parseInt(hex[8], 16) & 0x3f) | 0x80).toString(16)

  const s = hex.join('')
  return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20, 32)}`
}

export const createHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'ShelfStack-k6-LoadTest/1.0',
    ...customHeaders,
  }

  const token = getAuthToken()
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const authCookie = getAuthCookie()
  if (authCookie && !headers.Cookie) {
    headers.Cookie = authCookie
  }

  return headers
}

export const generateMidtransSignature = (orderId, statusCode, grossAmount, serverKey) => {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.sha512(payload, 'hex')
}

export const COMMON_THRESHOLDS = {
  catalog: {
    http_req_failed: ['rate<0.01'], // Kurang dari 1% error
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Toleransi dev server dan production
  },
  checkout: {
    checkout_server_errors: ['count==0'], // Tidak ada server crash 500
    http_req_duration: ['p(95)<1500', 'p(99)<2500'],
  },
  webhook: {
    webhook_server_errors: ['count==0'], // Tidak ada server crash 500
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
  health: {
    http_req_failed: ['rate<0.001'], // Health check harus stabil 99.9%
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
}
