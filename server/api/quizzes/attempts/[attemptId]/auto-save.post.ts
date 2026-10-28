import { quizAttemptService } from '../../../../services'
import { autoSaveAnswerSchema, batchAutoSaveSchema } from '../../../../utils/schemas'
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

    const rawBody = await readBody(event)

    // Mendukung batch auto-save ({ answers: [...] }) atau single answer ({ questionId: ..., ... })
    let answersToSave = []
    if (rawBody && Array.isArray(rawBody.answers)) {
      const parsed = batchAutoSaveSchema.parse(rawBody)
      answersToSave = parsed.answers
    } else if (rawBody && rawBody.questionId) {
      const parsed = autoSaveAnswerSchema.parse(rawBody)
      answersToSave = [parsed]
    } else {
      throw new BadRequestError('Format data auto-save tidak valid. Sertakan array "answers" atau objek butir soal')
    }

    const result = await quizAttemptService.autoSaveAnswers(attemptId, answersToSave, user.id)

    return createApiResponse(
      result,
      result.isExpired
        ? 'Waktu pengerjaan telah habis. Sesi ujian otomatis ditutup.'
        : `Progres ${result.savedCount} butir jawaban berhasil disimpan secara berkala (Auto-save)`,
      {
        attemptId: result.attemptId,
        savedCount: result.savedCount,
        remainingSeconds: result.remainingSeconds,
        expiresAt: result.expiresAt,
        isExpired: result.isExpired,
        lastSavedAt: result.lastSavedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
