export default defineEventHandler((event) => {
  const start = Date.now()
  const req = event.node?.req
  const res = event.node?.res
  const path = req?.url || ''
  const method = req?.method || 'GET'

  // Generate unique request tracking ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  event.context.requestId = requestId

  if (res) {
    res.setHeader('X-Request-Id', requestId)
    // Listen for response completion to log execution duration
    res.on('finish', () => {
      const duration = Date.now() - start
      const statusCode = res.statusCode
      if (path.startsWith('/api')) {
        console.log(`[HTTP] ${method} ${path} -> ${statusCode} (${duration}ms) [${requestId}]`)
      }
    })
  }
})
