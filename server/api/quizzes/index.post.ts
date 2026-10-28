import { quizService } from '../../services'
import { createQuizSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const body = await validateBody(event, createQuizSchema)

    const quiz = await quizService.createQuiz(body, user.id)

    setResponseStatus(event, 201)
    return createApiResponse(
      quiz,
      `Ujian '${quiz.title}' (${quiz.quizType}) berhasil dibuat`,
      {
        quizId: quiz.id,
        quizType: quiz.quizType,
        durationMinutes: quiz.durationMinutes,
        questionsCount: quiz.questionsCount,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
