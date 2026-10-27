import { courseService } from '../../../server/services'
import { createCourseSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // RBAC: Hanya Admin yang dapat menambahkan Mata Kuliah baru
    requireUserRole(event, ['admin'])

    const body = await validateBody(event, createCourseSchema)
    const newCourse = await courseService.createCourse(body)

    setResponseStatus(event, 201)
    return createApiResponse(newCourse, 'Mata kuliah baru berhasil ditambahkan', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
