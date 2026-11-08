import { classService } from '../../../server/services'
import { classQuerySchema } from '../../../server/utils/schemas'
import { validateQuery } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = validateQuery(event, classQuerySchema)
    const classes = await classService.getAllClasses(query)
    return createApiResponse(classes, 'Daftar kelas perkuliahan berhasil diambil', {
      total: classes.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
