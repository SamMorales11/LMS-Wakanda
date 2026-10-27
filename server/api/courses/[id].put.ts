import { courseService } from '../../../server/services'
import { updateCourseSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID mata kuliah tidak valid')
    }

    const body = await validateBody(event, updateCourseSchema)
    const updated = await courseService.updateCourse(id, body)

    return createApiResponse(updated, 'Mata kuliah berhasil diperbarui', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
