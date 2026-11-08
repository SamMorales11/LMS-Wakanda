import { userService } from '../../../../server/services'
import { resetPasswordSchema } from '../../../../server/utils/schemas'
import { validateBody } from '../../../../server/utils/validation'
import { createApiResponse } from '../../../../server/utils/response'
import { requireUserRole } from '../../../../server/utils/auth'
import { handleServerError, BadRequestError } from '../../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('User ID parameter is missing')
    }

    const body = await validateBody(event, resetPasswordSchema)
    const result = await userService.resetPassword(id, body.newPassword)

    return createApiResponse(
      result,
      result.message,
      {
        userId: id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
