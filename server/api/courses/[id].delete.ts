import { courseService } from '../../../server/services'
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

    const result = await courseService.deleteCourse(id)
    return createApiResponse(result, 'Mata kuliah berhasil dihapus', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
