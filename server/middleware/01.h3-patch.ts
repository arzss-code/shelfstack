import { defineEventHandler } from 'h3'

type PatchableHeaders = Record<string, string | string[] | undefined> & {
  get?: (name: string) => string | undefined
}

function ensureHeadersGet(headersObj: unknown): void {
  if (!headersObj || typeof headersObj !== 'object') return
  const hdrs = headersObj as PatchableHeaders
  if (typeof hdrs.get !== 'function') {
    Object.defineProperty(hdrs, 'get', {
      value: (name: string) => {
        const val = hdrs[name.toLowerCase()]
        return typeof val === 'string' ? val : Array.isArray(val) ? val[0] : undefined
      },
      enumerable: false,
      configurable: true,
      writable: true,
    })
  }
}

export default defineEventHandler((event) => {
  ensureHeadersGet(event.node?.req?.headers)
  ensureHeadersGet(event.req?.headers)
})
