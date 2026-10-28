import { gradebookService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const gradebook = await gradebookService.getClassGradebook(classId)

    return createApiResponse(
      gradebook,
      `Berhasil memuat Gradebook kelas '${gradebook.className}' (${gradebook.courseName})`,
      {
        classId: gradebook.classId,
        totalStudents: gradebook.totalStudents,
        averageFinalScore: gradebook.averageFinalScore,
        highestScore: gradebook.highestScore,
        lowestScore: gradebook.lowestScore,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
