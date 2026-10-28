import { assignmentService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    await assignmentService.deleteAssignment(id)

    return createApiResponse(
      { success: true },
      'Tugas berhasil dihapus',
      {
        assignmentId: id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
