import { quizService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const quizId = getRouterParam(event, 'id')

    if (!quizId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ujian wajib disertakan'
      })
    }

    const overview = await quizService.getQuizOverviewForLecturer(quizId, user.id)

    return createApiResponse(
      overview,
      `Rekapitulasi ujian '${overview.quiz.title}' berhasil dimuat`,
      {
        quizId,
        totalAttempts: overview.totalAttempts,
        totalStudents: overview.totalStudents,
        averageScore: overview.averageScore,
        highestScore: overview.highestScore,
        lowestScore: overview.lowestScore,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
