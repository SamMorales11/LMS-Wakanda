import { defineEventHandler, setResponseStatus } from 'h3'
import { academicTermService } from '../../../server/services'
import { createAcademicTermSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // RBAC: Hanya Admin yang dapat membuat Tahun Akademik baru
    requireUserRole(event, ['admin'])

    const body = await validateBody(event, createAcademicTermSchema)
    const newTerm = await academicTermService.createTerm(body)

    setResponseStatus(event, 201)
    return createApiResponse(newTerm, 'Tahun akademik berhasil dibuat', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
