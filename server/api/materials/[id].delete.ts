import { materialService } from '../../services'
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

    const result = await materialService.deleteMaterial(id)

    return createApiResponse(
      result,
      'Materi perkuliahan berhasil dihapus',
      {
        materialId: id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
