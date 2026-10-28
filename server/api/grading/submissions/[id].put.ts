import { gradingService } from '../../../services'
import { gradeSubmissionDetailSchema } from '../../../utils/schemas'
import { validateBody } from '../../../utils/validation'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID pengumpulan tugas wajib disertakan')
    }

    const host = getRequestHeader(event, 'host')
    const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
    const origin = host ? `${protocol}://${host}` : undefined

    const body = await validateBody(event, gradeSubmissionDetailSchema)
    const result = await gradingService.gradeAssignmentSubmission(id, body, user.id, origin)

    const statusMsg = result.status === 'RESUBMISSION_REQUESTED'
      ? `Penilaian disimpan: Meminta revisi pengumpulan tugas untuk mahasiswa ${result.studentName}`
      : `Nilai tugas ${result.studentName} berhasil disimpan: ${result.score}/${result.maxScore} (${result.percentage}%)`

    return createApiResponse(
      result,
      statusMsg,
      {
        submissionId: result.submissionId,
        studentId: result.studentId,
        score: result.score,
        percentage: result.percentage,
        status: result.status,
        gradedAt: result.gradedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
