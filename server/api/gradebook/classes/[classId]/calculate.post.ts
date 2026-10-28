import { gradebookService } from '../../../../services'
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

    const gradebook = await gradebookService.calculateAndPersistClassGradebook(classId, user.id)

    return createApiResponse(
      gradebook,
      `Kalkulasi Nilai Akhir (NA) dan konversi huruf mutu kelas '${gradebook.className}' berhasil disimpan ke database`,
      {
        classId: gradebook.classId,
        totalStudents: gradebook.totalStudents,
        averageFinalScore: gradebook.averageFinalScore,
        gradeDistribution: gradebook.gradeDistribution,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
