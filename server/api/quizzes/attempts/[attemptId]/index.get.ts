import { quizService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const attemptId = getRouterParam(event, 'attemptId')

    if (!attemptId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID percobaan ujian wajib disertakan'
      })
    }

    const attempt = await quizService.getAttemptById(attemptId, user.role, user.id)

    return createApiResponse(
      attempt,
      `Detail percobaan ujian berhasil dimuat`,
      {
        attemptId: attempt.id,
        status: attempt.status,
        score: attempt.score,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
