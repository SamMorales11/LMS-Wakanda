import { ewsService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserRole } from '../../../utils/auth'
import { handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['admin', 'lecturer'])

    const summary = await ewsService.getDepartmentEwsOverview()

    return createApiResponse(
      summary,
      `Ikhtisar telemetri Academic Early Warning System (EWS) periode ${summary.termName} berhasil diproses`,
      {
        totalClasses: summary.totalClassesAnalyzed,
        totalStudents: summary.totalStudentsAnalyzed,
        criticalCount: summary.overallCriticalCount,
        warningCount: summary.overallWarningCount,
        safeCount: summary.overallSafeCount,
        averageDepartmentRisk: summary.averageDepartmentRisk,
        atRiskPercentage: summary.overallAtRiskPercentage,
        highRiskClassesCount: summary.highRiskClasses.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
