import { assignmentService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Kelas wajib disertakan')
    }

    const studentId = user.role === 'student' ? user.id : undefined
    const assignmentsList = await assignmentService.getAssignmentsByClass(id, studentId)

    return createApiResponse(
      assignmentsList,
      `Berhasil mengambil ${assignmentsList.length} tugas untuk kelas ini`,
      {
        classId: id,
        count: assignmentsList.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
