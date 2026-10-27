import { materialService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)

    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw new BadRequestError('Parameter sessionId tidak valid')
    }

    const progress = await materialService.getStudentProgress(sessionId, user.id)

    return createApiResponse(
      progress,
      'Progres bacaan materi perkuliahan berhasil dimuat',
      {
        sessionId,
        studentId: user.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
