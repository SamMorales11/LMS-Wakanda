import { quizService } from '../../../services'
import { updateQuizSchema } from '../../../utils/schemas'
import { validateBody } from '../../../utils/validation'
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

    const body = await validateBody(event, updateQuizSchema)
    const updated = await quizService.updateQuiz(id, body, user.id)

    return createApiResponse(
      updated,
      `Ujian '${updated.title}' berhasil diperbarui`,
      {
        quizId: updated.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
