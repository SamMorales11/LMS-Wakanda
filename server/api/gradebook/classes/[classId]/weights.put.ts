import { gradebookService } from '../../../../services'
import { configureGradeWeightsSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const body = await validateBody(event, configureGradeWeightsSchema)
    const weights = await gradebookService.configureGradeWeights(classId, body, user.id)

    return createApiResponse(
      weights,
      'Bobot penilaian kelas berhasil diperbarui dan diselaraskan ke 100%',
      {
        classId,
        componentsCount: weights.length,
        totalPercentage: weights.reduce((acc, w) => acc + w.weightPercentage, 0),
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
