import { quizAttemptService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const attemptId = getRouterParam(event, 'attemptId')

    if (!attemptId) {
      throw new BadRequestError('ID percobaan ujian wajib disertakan')
    }

    const closed = await quizAttemptService.autoCloseAttempt(attemptId, user.id)

    return createApiResponse(
      closed,
      `Waktu ujian telah habis. Sesi ujian otomatis ditutup dengan status '${closed.status}'. Skor auto-grading: ${closed.autoScore}`,
      {
        attemptId: closed.id,
        status: closed.status,
        score: closed.score,
        autoScore: closed.autoScore,
        submittedAt: closed.submittedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
