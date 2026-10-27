import { materialService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw new BadRequestError('Parameter sessionId tidak valid')
    }

    const currentUser = event.context.user
    const studentId = currentUser?.role === 'student' ? currentUser.id : undefined

    const protocol = getRequestProtocol(event)
    const host = getRequestHost(event)
    const origin = `${protocol}://${host}`

    const materials = await materialService.getMaterialsBySession(sessionId, studentId, origin)

    return createApiResponse(
      materials,
      'Daftar materi perkuliahan sesi berhasil dimuat',
      {
        total: materials.length,
        sessionId,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
