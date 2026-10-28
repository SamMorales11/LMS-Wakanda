import { assignmentService } from '../../services'
import { createAssignmentSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const body = await validateBody(event, createAssignmentSchema)

    const assignment = await assignmentService.createAssignment(body, user.id)

    setResponseStatus(event, 201)
    return createApiResponse(
      assignment,
      `Tugas '${assignment.title}' berhasil dibuat`,
      {
        assignmentId: assignment.id,
        dueDate: assignment.dueDate,
        cutoffDate: assignment.cutoffDate,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
