import { quizAttemptService } from '../../../../services'
import { toggleDoubtfulSchema } from '../../../../utils/schemas'
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

    const body = await validateBody(event, toggleDoubtfulSchema)
    const result = await quizAttemptService.toggleDoubtful(
      attemptId,
      body.questionId,
      body.isDoubtful,
      user.id
    )

    return createApiResponse(
      result,
      body.isDoubtful
        ? `Soal ${body.questionId} ditandai ragu-ragu`
        : `Tanda ragu-ragu pada soal ${body.questionId} dibatalkan`,
      {
        attemptId,
        questionId: result.questionId,
        isDoubtful: result.isDoubtful,
        remainingSeconds: result.remainingSeconds,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
