import { quizService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const sessionId = getRouterParam(event, 'sessionId')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID sesi pertemuan wajib disertakan'
      })
    }

    const quizzes = await quizService.getQuizzesBySessionId(sessionId, user.role, user.id)

    return createApiResponse(
      quizzes,
      `Berhasil memuat ${quizzes.length} ujian untuk sesi ini`,
      {
        sessionId,
        total: quizzes.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
