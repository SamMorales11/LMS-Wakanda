import { gradingService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID pengumpulan tugas wajib disertakan')
    }

    const host = getRequestHeader(event, 'host')
    const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
    const origin = host ? `${protocol}://${host}` : undefined

    const result = await gradingService.getSubmissionSignedReadUrl(id, origin)

    return createApiResponse(
      result,
      `Signed Read URL berhasil digenerate untuk berkas '${result.fileName}'`,
      {
        submissionId: id,
        expiresAt: result.expiresAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
