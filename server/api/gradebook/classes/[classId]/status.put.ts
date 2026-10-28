import { gradebookService } from '../../../../services'
import { updateGradeStatusSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const body = await validateBody(event, updateGradeStatusSchema)
    const result = await gradebookService.updateClassGradeStatus(classId, body.status, user.id)

    return createApiResponse(
      result,
      `Status publikasi nilai kelas berhasil diperbarui menjadi ${result.status}`,
      {
        classId,
        status: result.status,
        updatedCount: result.updatedCount,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
