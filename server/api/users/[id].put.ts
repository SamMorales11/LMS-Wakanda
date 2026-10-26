import { defineEventHandler, getRouterParam } from 'h3'
import { userService } from '../../../server/services'
import { updateUserSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('User ID parameter is missing')
    }

    const body = await validateBody(event, updateUserSchema)
    const updated = await userService.updateUser(id, body)

    return createApiResponse(updated, 'User updated successfully', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
