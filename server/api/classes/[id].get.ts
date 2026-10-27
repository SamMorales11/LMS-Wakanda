import { defineEventHandler, getRouterParam } from 'h3'
import { classService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID kelas tidak valid')
    }

    const detail = await classService.getClassDetail(id)
    return createApiResponse(detail, 'Detail kelas perkuliahan berhasil diambil', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
