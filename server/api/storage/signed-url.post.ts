import { storageService } from '../../../server/services'
import { signedReadUrlSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'
import { requireUserAuth } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 0. Autentikasi sesi: Hanya pengguna login yang berhak meminta signed read URL
    requireUserAuth(event)

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
