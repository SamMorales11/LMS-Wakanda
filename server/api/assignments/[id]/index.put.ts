import { assignmentService } from '../../../services'
import { updateAssignmentSchema } from '../../../utils/schemas'
import { validateBody } from '../../../utils/validation'
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

    const body = await validateBody(event, updateAssignmentSchema)
    const updated = await assignmentService.updateAssignment(id, body)

    return createApiResponse(
      updated,
      `Tugas '${updated.title}' berhasil diperbarui`,
      {
        assignmentId: updated.id,
        dueDate: updated.dueDate,
        cutoffDate: updated.cutoffDate,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
