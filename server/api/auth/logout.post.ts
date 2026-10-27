import { defineEventHandler } from 'h3'
import { authService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await authService.logout(event)

    return createApiResponse(null, 'Berhasil keluar dari sesi LMS Wakanda', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
