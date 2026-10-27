import { userService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('User ID parameter is missing')
    }

    const user = await userService.getUserById(id)
    return createApiResponse(user, 'User details retrieved successfully', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
