import { defineEventHandler, getRouterParam } from 'h3'
import { classService } from '../../../server/services'
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

    const result = await classService.deleteClass(id)
    return createApiResponse(result, 'Kelas perkuliahan beserta seluruh relasi berhasil dihapus', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
