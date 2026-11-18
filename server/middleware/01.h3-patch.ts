type PatchableHeaders = Record<string, string | string[] | undefined> & {
  get?: (name: string) => string | undefined
}

function ensureHeadersGet(headersObj: unknown): void {
  if (!headersObj || typeof headersObj !== 'object') return
  const hdrs = headersObj as PatchableHeaders
  if (typeof hdrs.get !== 'function') {
    hdrs.get = (name: string) => {
      const val = hdrs[name.toLowerCase()]
      return typeof val === 'string' ? val : Array.isArray(val) ? val[0] : undefined
    }
  }
}

export default defineEventHandler((event) => {
  ensureHeadersGet(event.node?.req?.headers)
  ensureHeadersGet(event.req?.headers)
})
