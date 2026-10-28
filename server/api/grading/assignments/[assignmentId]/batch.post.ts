import { gradingService } from '../../../../services'
import { batchGradeSubmissionSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
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

    const body = await validateBody(event, batchGradeSubmissionSchema)
    const result = await gradingService.batchGradeSubmissions(assignmentId, body, user.id, origin)

    return createApiResponse(
      result,
      `Berhasil memperbarui nilai ${result.updatedCount} pengumpulan tugas secara kolektif`,
      {
        assignmentId,
        updatedCount: result.updatedCount,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
