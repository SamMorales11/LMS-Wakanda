import { quizService } from '../../../../services'
import { gradeQuizEssaySchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const attemptId = getRouterParam(event, 'attemptId')

    if (!attemptId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID percobaan ujian wajib disertakan'
      })
    }

    const body = await validateBody(event, gradeQuizEssaySchema)
    const graded = await quizService.gradeAttemptEssays(attemptId, body, user.id)

    return createApiResponse(
      graded,
      `Penilaian esai berhasil disimpan. Skor akhir: ${graded.score}`,
      {
        attemptId: graded.id,
        score: graded.score,
        manualScore: graded.manualScore,
        autoScore: graded.autoScore,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
