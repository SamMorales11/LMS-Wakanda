import { materialService } from '../../../../services'
import { createSessionMaterialSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    // Hanya Dosen dan Administrator yang berhak mengunggah/menambahkan materi
    requireUserRole(event, ['lecturer', 'admin'])

    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw new BadRequestError('Parameter sessionId tidak valid')
    }

    const body = await validateBody(event, createSessionMaterialSchema)
    const newMaterial = await materialService.createMaterial(sessionId, body)

    setResponseStatus(event, 201)
    return createApiResponse(
      newMaterial,
      `Materi '${newMaterial.title}' berhasil ditambahkan ke sesi perkuliahan`,
      {
        sessionId,
        materialId: newMaterial.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
