import fs from 'node:fs'
import path from 'node:path'
import { storageService } from '../../../../server/services'
import { BadRequestError, NotFoundError, UnauthorizedError, handleServerError } from '../../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const key = typeof query.key === 'string' ? query.key : ''
    const expires = typeof query.expires === 'string' ? query.expires : ''
    const token = typeof query.token === 'string' ? query.token : ''

    if (!key || !expires || !token) {
      throw new BadRequestError('Parameter key, expires, dan token akses wajib disertakan')
    }

    // Verifikasi HMAC token dan masa berlaku 15 menit
    const isValid = storageService.verifyLocalToken(key, expires, token)
    if (!isValid) {
      throw new UnauthorizedError(
        'Tautan unduh berkas tidak valid atau telah kedaluwarsa (batas 15 menit)'
      )
    }

    const localPath = storageService.getLocalFilePath(key)
    if (!fs.existsSync(localPath)) {
      throw new NotFoundError(`Berkas dengan kunci '${key}' tidak ditemukan di penyimpanan lokal`)
    }

    // Tentukan Content-Type berdasarkan ekstensi berkas
    const ext = path.extname(localPath).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.pdf') {
      contentType = 'application/pdf'
    } else if (ext === '.zip') {
      contentType = 'application/zip'
    }

    const fileName = path.basename(localPath)
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Content-Disposition', `inline; filename="${fileName}"`)
    setResponseHeader(event, 'Cache-Control', 'private, max-age=900') // 15 menit

    // Stream file ke response
    const stream = fs.createReadStream(localPath)
    return sendStream(event, stream)
  } catch (error) {
    return handleServerError(error)
  }
})
