import { quizAttemptService } from '../../../../services'
import { submitQuizAnswerSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
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

    const body = await validateBody(event, submitQuizAnswerSchema)
    const attempt = await quizAttemptService.submitExam(attemptId, body.answers, user.id)

    return createApiResponse(
      attempt,
      attempt.status === 'GRADED'
        ? `Ujian berhasil diselesaikan! Skor akhir: ${attempt.score}`
        : attempt.status === 'TIMED_OUT'
          ? `Waktu ujian telah habis. Jawaban dikumpulkan otomatis dengan status 'TIMED_OUT'. Skor: ${attempt.score || attempt.autoScore}`
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
