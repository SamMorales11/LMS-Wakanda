import { defineEventHandler, getRouterParam } from 'h3'
import { academicTermService } from '../../../../server/services'
import { createApiResponse } from '../../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../../server/utils/errors'
import { requireUserRole } from '../../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID semester tidak valid')
    }

    const activated = await academicTermService.activateTerm(id)
    return createApiResponse(activated, `Tahun akademik [${activated.code}] sekarang aktif sebagai semester berjalan`, {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
