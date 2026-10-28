import { assignmentService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const sessionId = getRouterParam(event, 'sessionId')

    if (!sessionId) {
      throw new BadRequestError('ID Sesi wajib disertakan')
    }

    const studentId = user.role === 'student' ? user.id : undefined
    const assignmentsList = await assignmentService.getAssignmentsBySession(sessionId, studentId)

    return createApiResponse(
      assignmentsList,
      `Berhasil mengambil ${assignmentsList.length} tugas untuk sesi ini`,
      {
        sessionId,
        count: assignmentsList.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
