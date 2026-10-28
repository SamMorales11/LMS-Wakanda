import { quizService } from '../../../../services'
import { submitQuizAnswerSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
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

    const body = await validateBody(event, submitQuizAnswerSchema)
    const attempt = await quizService.submitAttempt(attemptId, body, user.id)

    return createApiResponse(
      attempt,
      attempt.status === 'GRADED'
        ? `Ujian berhasil diselesaikan! Skor akhir: ${attempt.score}`
        : 'Jawaban ujian berhasil dikumpulkan dan menunggu penilaian dosen untuk soal esai',
      {
        attemptId: attempt.id,
        status: attempt.status,
        score: attempt.score,
        autoScore: attempt.autoScore,
        submittedAt: attempt.submittedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
