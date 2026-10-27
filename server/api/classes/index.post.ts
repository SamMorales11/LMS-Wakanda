import { defineEventHandler, setResponseStatus } from 'h3'
import { classService } from '../../../server/services'
import { createCourseClassSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // RBAC: Hanya Admin yang dapat membuka Kelas Paralel (Rombongan Belajar) baru
    requireUserRole(event, ['admin'])

    const body = await validateBody(event, createCourseClassSchema)

    // Mengeksekusi database transaction otomatis untuk membuat kelas,
    // 16 sesi pertemuan, dan bobot nilai default 100%
    const newClassDetail = await classService.createClass(body)

    setResponseStatus(event, 201)
    return createApiResponse(
      newClassDetail,
      `Kelas paralel '${newClassDetail.code}' berhasil dibuat lengkap dengan 16 sesi pertemuan dan inisialisasi bobot nilai 100%`,
      {
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
