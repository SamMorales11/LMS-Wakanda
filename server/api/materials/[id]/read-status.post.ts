import { materialService } from '../../../services'
import { toggleMaterialReadSchema } from '../../../utils/schemas'
import { validateBody } from '../../../utils/validation'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw new BadRequestError('ID materi tidak valid')
    }

    const body = await validateBody(event, toggleMaterialReadSchema)
    const result = await materialService.toggleReadStatus(id, user.id, body.isCompleted)

    return createApiResponse(
      result,
      body.isCompleted ? 'Materi telah ditandai selesai dipelajari' : 'Status materi diatur kembali belum selesai',
      {
        materialId: id,
        studentId: user.id,
        isCompleted: result.isCompleted,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
