export default defineEventHandler((event) => {
  if (
    event.node &&
    event.node.req &&
    event.node.req.headers &&
    typeof (event.node.req.headers as any).get !== 'function'
  ) {
    ;(event.node.req.headers as any).get = (name: string) =>
      event.node.req.headers[name.toLowerCase()] as string | undefined
  }

  if (event.req && event.req.headers && typeof (event.req.headers as any).get !== 'function') {
    ;(event.req.headers as any).get = (name: string) =>
      (event.req.headers as any)[name.toLowerCase()] as string | undefined
  }
})
