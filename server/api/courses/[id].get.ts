import { defineEventHandler, getRouterParam } from 'h3'
import { courseService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID mata kuliah tidak valid')
    }

    const course = await courseService.getCourseById(id)
    return createApiResponse(course, 'Detail mata kuliah berhasil diambil', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
