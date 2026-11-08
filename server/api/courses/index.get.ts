import { courseService } from '../../../server/services'
import { courseQuerySchema } from '../../../server/utils/schemas'
import { validateQuery } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = validateQuery(event, courseQuerySchema)
    const coursesList = await courseService.getAllCourses(query)
    return createApiResponse(coursesList, 'Daftar mata kuliah berhasil diambil', {
      total: coursesList.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
