import { quizService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ujian wajib disertakan'
      })
    }

    const quiz = await quizService.getQuizById(id, user.role, user.id)

    return createApiResponse(
      quiz,
      `Detail ujian '${quiz.title}' berhasil dimuat`,
      {
        quizId: quiz.id,
        accessStatus: quiz.accessStatus,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
