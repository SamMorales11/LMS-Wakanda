import { quizAttemptService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const quizId = getRouterParam(event, 'id')

    if (!quizId) {
      throw new BadRequestError('ID ujian wajib disertakan')
    }

    const sessionState = await quizAttemptService.initiateOrResumeSession(quizId, user.id)

    return createApiResponse(
      sessionState,
      `Sesi pengerjaan ujian '${sessionState.quizTitle}' dimulai. Batas waktu server (expires_at): ${sessionState.expiresAt}`,
      {
        attemptId: sessionState.attemptId,
        remainingSeconds: sessionState.remainingSeconds,
        expiresAt: sessionState.expiresAt,
        totalQuestions: sessionState.totalQuestions,
        answeredCount: sessionState.answeredCount,
        doubtfulCount: sessionState.doubtfulCount,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
