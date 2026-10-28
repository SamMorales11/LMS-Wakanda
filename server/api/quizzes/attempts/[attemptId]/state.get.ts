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

    const state = await quizAttemptService.getSessionState(attemptId, user.id)

    return createApiResponse(
      state,
      `State sesi ujian '${state.quizTitle}' berhasil disinkronisasi`,
      {
        attemptId: state.attemptId,
        remainingSeconds: state.remainingSeconds,
        isExpired: state.isExpired,
        answeredCount: state.answeredCount,
        doubtfulCount: state.doubtfulCount,
        totalQuestions: state.totalQuestions,
        status: state.status,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
