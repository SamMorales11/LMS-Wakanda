import { classService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const academicTermId = typeof query.academicTermId === 'string' ? query.academicTermId : undefined
    const courseId = typeof query.courseId === 'string' ? query.courseId : undefined
    const search = typeof query.search === 'string' ? query.search : undefined

    const classes = await classService.getAllClasses({ academicTermId, courseId, search })
    return createApiResponse(classes, 'Daftar kelas perkuliahan berhasil diambil', {
      total: classes.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
