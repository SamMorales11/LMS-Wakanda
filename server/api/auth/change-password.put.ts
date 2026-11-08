import { authService } from '../../services'
import { changePasswordSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserAuth } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const body = await validateBody(event, changePasswordSchema)

    const result = await authService.changePassword(user.id, body)

    return createApiResponse(
      result,
      result.message,
      {
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
