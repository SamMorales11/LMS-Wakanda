import { academicTermService } from '../../../server/services'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const terms = await academicTermService.getAllTerms()
    return createApiResponse(terms, 'Data tahun akademik berhasil diambil', {
      total: terms.length,
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
