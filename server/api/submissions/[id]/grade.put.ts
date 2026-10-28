import { assignmentService } from '../../../services'
import { gradeSubmissionSchema } from '../../../utils/schemas'
import { validateBody } from '../../../utils/validation'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Pengumpulan Tugas wajib disertakan')
    }

    const body = await validateBody(event, gradeSubmissionSchema)
    const graded = await assignmentService.gradeSubmission(id, body, user.id)

    return createApiResponse(
      graded,
      `Nilai tugas berhasil disimpan: ${graded.score} poin`,
      {
        submissionId: graded.id,
        assignmentId: graded.assignmentId,
        score: graded.score,
        gradedBy: user.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
