import { classService } from '../../../server/services'
import { updateCourseClassSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID kelas tidak valid')
    }

    const body = await validateBody(event, updateCourseClassSchema)
    const updated = await classService.updateClass(id, body)

    return createApiResponse(updated, 'Data kelas perkuliahan berhasil diperbarui', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
