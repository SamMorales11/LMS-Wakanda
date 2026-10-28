import { gradingService } from '../../../../../services'
import { gradeQuizEssayDetailSchema } from '../../../../../utils/schemas'
import { validateBody } from '../../../../../utils/validation'
import { createApiResponse } from '../../../../../utils/response'
import { requireUserRole } from '../../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const attemptId = getRouterParam(event, 'attemptId')

    if (!attemptId) {
      throw new BadRequestError('ID percobaan ujian wajib disertakan')
    }

    const body = await validateBody(event, gradeQuizEssayDetailSchema)
    const result = await gradingService.gradeQuizAttemptEssay(attemptId, body, user.id)

    return createApiResponse(
      result,
      `Penilaian soal esai berhasil disimpan! Total skor ujian mahasiswa ${result.studentName} diperbarui: ${result.totalScore}/${result.maxScore} (Pilihan Ganda: ${result.autoScore}, Esai: ${result.manualScore})`,
      {
        attemptId: result.attemptId,
        studentId: result.studentId,
        autoScore: result.autoScore,
        manualScore: result.manualScore,
        totalScore: result.totalScore,
        percentage: result.percentage,
        isPassed: result.isPassed,
        status: result.status,
        gradedAt: result.gradedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
