import { authService } from '../../../server/services'
import { loginSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await validateBody(event, loginSchema)
    const result = await authService.login(body, event)

    return createApiResponse(result, 'Autentikasi berhasil, selamat datang di LMS Wakanda', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
