import { assignmentService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const overview = await assignmentService.getAssignmentOverview(id)

    return createApiResponse(
      overview,
      `Ikhtisar pengumpulan tugas '${overview.assignment.title}' berhasil diambil`,
      {
        assignmentId: id,
        totalEnrolled: overview.totalEnrolled,
        submittedCount: overview.submittedCount,
        onTimeCount: overview.onTimeCount,
        lateCount: overview.lateCount,
        gradedCount: overview.gradedCount,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
