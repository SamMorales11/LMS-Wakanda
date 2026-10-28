import { gradingService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const assignmentId = getRouterParam(event, 'assignmentId')

    if (!assignmentId) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const host = getRequestHeader(event, 'host')
    const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
    const origin = host ? `${protocol}://${host}` : undefined

    const result = await gradingService.getCollectiveAssignmentSubmissions(assignmentId, user.id, origin)

    return createApiResponse(
      result,
      `Berhasil memuat ${result.submittedCount} pengumpulan tugas '${result.assignmentTitle}' beserta Signed Read URLs`,
      {
        assignmentId: result.assignmentId,
        totalEnrolled: result.totalEnrolled,
        submittedCount: result.submittedCount,
        gradedCount: result.gradedCount,
        resubmissionCount: result.resubmissionCount,
        pendingCount: result.pendingCount,
        averageScore: result.averageScore,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
