import { gradingService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const quizId = getRouterParam(event, 'quizId')

    if (!quizId) {
      throw new BadRequestError('ID ujian wajib disertakan')
    }

    const result = await gradingService.getCollectiveQuizAttempts(quizId, user.id)

    return createApiResponse(
      result,
      `Berhasil memuat ${result.totalAttempts} percobaan ujian '${result.quizTitle}' (${result.pendingEssayCount} butir esai menunggu penilaian)`,
      {
        quizId: result.quizId,
        quizType: result.quizType,
        totalAttempts: result.totalAttempts,
        gradedCount: result.gradedCount,
        pendingEssayCount: result.pendingEssayCount,
        averageScore: result.averageScore,
        highestScore: result.highestScore,
        lowestScore: result.lowestScore,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
