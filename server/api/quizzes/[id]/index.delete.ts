import { quizService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ujian wajib disertakan'
      })
    }

    await quizService.deleteQuiz(id, user.id)

    return createApiResponse(
      { deleted: true },
      'Ujian berhasil dihapus',
      {
        quizId: id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
