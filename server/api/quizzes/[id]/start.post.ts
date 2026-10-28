import { quizService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const quizId = getRouterParam(event, 'id')

    if (!quizId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ujian wajib disertakan'
      })
    }

    const result = await quizService.startOrResumeAttempt(quizId, user.id)

    return createApiResponse(
      result,
      `Sesi pengerjaan ujian dimulai. Batas waktu pengerjaan: ${result.deadlineAt}`,
      {
        attemptId: result.attempt.id,
        attemptNumber: result.attempt.attemptNumber,
        remainingSeconds: result.remainingSeconds,
        deadlineAt: result.deadlineAt,
        questionsCount: result.questions.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
