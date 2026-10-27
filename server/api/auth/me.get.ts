import { authService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await authService.getCurrentUser(event)

    return createApiResponse(user, 'Profil pengguna aktif berhasil diambil', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
