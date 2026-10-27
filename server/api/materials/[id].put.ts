import { materialService } from '../../services'
import { updateSessionMaterialSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { BadRequestError, handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID materi tidak valid')
    }

    const body = await validateBody(event, updateSessionMaterialSchema)
    const updated = await materialService.updateMaterial(id, body)

    return createApiResponse(
      updated,
      `Materi '${updated.title}' berhasil diperbarui`,
      {
        materialId: updated.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
