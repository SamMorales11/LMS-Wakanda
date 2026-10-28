import { z } from 'zod'
import { assignmentService } from '../../../services'
import { validateBody } from '../../../utils/validation'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

const uploadUrlRequestSchema = z.object({
  fileName: z.string({ required_error: 'Nama berkas wajib diisi' }).min(1),
  fileType: z.string().default('application/octet-stream'),
  fileSize: z.number().int().positive('Ukuran berkas harus positif')
})

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const body = await validateBody(event, uploadUrlRequestSchema)

    const protocol = getRequestProtocol(event)
    const host = getRequestHost(event)
    const origin = `${protocol}://${host}`

    const presigned = await assignmentService.requestPresignedUpload(
      id,
      user.id,
      body.fileName,
      body.fileType || 'application/octet-stream',
      body.fileSize,
      origin
    )

    setResponseStatus(event, 201)
    return createApiResponse(
      presigned,
      `Presigned upload URL berkas tugas berhasil dibuat (${presigned.driver.toUpperCase()})`,
      {
        assignmentId: id,
        fileKey: presigned.fileKey,
        expiresInSeconds: presigned.expiresInSeconds,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
