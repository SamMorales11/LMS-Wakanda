import { defineEventHandler, getRouterParam } from 'h3'
import { academicTermService } from '../../../server/services'
import { updateAcademicTermSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, BadRequestError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID semester tidak valid')
    }

    const body = await validateBody(event, updateAcademicTermSchema)
    const updated = await academicTermService.updateTerm(id, body)

    return createApiResponse(updated, 'Tahun akademik berhasil diperbarui', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
