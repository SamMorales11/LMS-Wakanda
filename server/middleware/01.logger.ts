import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const start = Date.now()
  const path = event.node.req.url || ''
  const method = event.node.req.method || 'GET'

  // Generate unique request tracking ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  event.context.requestId = requestId
  event.node.res.setHeader('X-Request-Id', requestId)

  // Listen for response completion to log execution duration
  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    const statusCode = event.node.res.statusCode
    if (path.startsWith('/api')) {
      console.log(`[HTTP] ${method} ${path} -> ${statusCode} (${duration}ms) [${requestId}]`)
    }
  })
})
