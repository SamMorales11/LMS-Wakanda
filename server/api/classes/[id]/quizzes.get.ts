import { quizService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const classId = getRouterParam(event, 'id')

    if (!classId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID kelas wajib disertakan'
      })
    }

    const quizzes = await quizService.getQuizzesByClassId(classId, user.role, user.id)

    return createApiResponse(
      quizzes,
      `Berhasil memuat ${quizzes.length} ujian untuk kelas ini`,
      {
        classId,
        total: quizzes.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
