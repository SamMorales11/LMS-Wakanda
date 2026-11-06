import { storageService } from '../../../server/services'
import { presignedUploadSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'
import { requireUserAuth } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 0. Autentikasi sesi: Hanya pengguna login yang berhak meminta presigned upload URL
    requireUserAuth(event)

    // 1. Validasi Zod: format berkas PDF/ZIP, max size 25MB, kategori, sanitize filename
    const body = await validateBody(event, presignedUploadSchema)

    // 2. Dapatkan origin URL untuk keperluan local storage fallback
    const protocol = getRequestProtocol(event)
    const host = getRequestHost(event)
    const origin = `${protocol}://${host}`

    // 3. Hasilkan Presigned Upload URL & Signed Read URL (15 menit)
    const result = await storageService.createPresignedUpload(body, origin)

    setResponseStatus(event, 201)
    return createApiResponse(
      result,
      `Presigned upload URL (${result.driver.toUpperCase()}) berhasil dibuat berdurasi ${result.expiresInSeconds / 60} menit`,
      {
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
