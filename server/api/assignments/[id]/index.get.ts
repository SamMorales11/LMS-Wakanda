import { assignmentService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const query = getQuery(event)
    let studentId = user.role === 'student' ? user.id : (typeof query.studentId === 'string' ? query.studentId : undefined)

    const assignment = await assignmentService.getAssignmentById(id, studentId)

    return createApiResponse(
      assignment,
      `Data tugas '${assignment.title}' berhasil diambil`,
      {
        assignmentId: assignment.id,
        isExpired: assignment.isExpired,
        isClosed: assignment.isClosed,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
