import { systemService } from '../../server/services'
import { createApiResponse } from '../../server/utils/response'
import { handleServerError } from '../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const health = await systemService.getHealth()
    return createApiResponse(health, 'System is healthy', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
