import { userService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('User ID parameter is missing')
    }

    const result = await userService.deleteUser(id)
    return createApiResponse(result, 'User deleted successfully', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
