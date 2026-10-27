import { storageService } from '../../../server/services'
import { signedReadUrlSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await validateBody(event, signedReadUrlSchema)

    const protocol = getRequestProtocol(event)
    const host = getRequestHost(event)
    const origin = `${protocol}://${host}`

    const result = await storageService.createSignedReadUrl(body, origin)

    return createApiResponse(
      result,
      `Signed read URL (${result.driver.toUpperCase()}) berhasil dibuat berdurasi ${result.expiresInSeconds / 60} menit`,
      {
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
