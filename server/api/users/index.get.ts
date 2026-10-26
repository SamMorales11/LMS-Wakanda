import { defineEventHandler } from 'h3'
import { userService } from '../../../server/services'
import { userQuerySchema } from '../../../server/utils/schemas'
import { validateQuery } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = validateQuery(event, userQuerySchema)
    const users = await userService.getAllUsers(query)
    return createApiResponse(users, 'Users retrieved successfully', {
      total: users.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
