import { ewsService } from '../../../../services'
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

    const overview = await ewsService.getClassEwsOverview(classId)

    return createApiResponse(
      overview,
      `Analisis telemetri EWS kelas '${overview.className}' (${overview.courseName}) berhasil diproses`,
      {
        classId: overview.classId,
        totalStudents: overview.totalEnrolledStudents,
        criticalCount: overview.criticalStudentsCount,
        warningCount: overview.warningStudentsCount,
        safeCount: overview.safeStudentsCount,
        averageCompositeRisk: overview.riskSummary.averageCompositeRisk,
        atRiskPercentage: overview.riskSummary.atRiskPercentage,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
