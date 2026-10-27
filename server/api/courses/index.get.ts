import { defineEventHandler, getQuery } from 'h3'
import { courseService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const programId = typeof query.programId === 'string' ? query.programId : undefined
    const search = typeof query.search === 'string' ? query.search : undefined

    const coursesList = await courseService.getAllCourses({ programId, search })
    return createApiResponse(coursesList, 'Daftar mata kuliah berhasil diambil', {
      total: coursesList.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
