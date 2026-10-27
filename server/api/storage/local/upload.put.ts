import { storageService } from '../../../../server/services'
import { createApiResponse } from '../../../../server/utils/response'
import { BadRequestError, UnauthorizedError, handleServerError } from '../../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const key = typeof query.key === 'string' ? query.key : ''
    const expires = typeof query.expires === 'string' ? query.expires : ''
    const token = typeof query.token === 'string' ? query.token : ''

    if (!key || !expires || !token) {
      throw new BadRequestError('Parameter key, expires, dan token presigned wajib disertakan')
    }

    // Verifikasi HMAC token dan masa berlaku 15 menit
    const isValid = storageService.verifyLocalToken(key, expires, token)
    if (!isValid) {
      throw new UnauthorizedError(
        'Tautan upload lokal tidak valid atau telah kedaluwarsa (batas 15 menit)'
      )
    }

    // Baca raw binary payload yang di-upload oleh client (PUT request)
    const rawBuffer = await readRawBody(event, false)
    if (!rawBuffer || rawBuffer.length === 0) {
      throw new BadRequestError('Isi berkas yang di-upload kosong')
    }

    // Simpan berkas ke direktori local storage
    await storageService.saveLocalFile(key, rawBuffer)

    setResponseStatus(event, 201)
    return createApiResponse(
      {
        fileKey: key,
        bytesWritten: rawBuffer.length,
        driver: 'local'
      },
      'Berkas berhasil diunggah ke penyimpanan lokal (fallback)',
      {
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
