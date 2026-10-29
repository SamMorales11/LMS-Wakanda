import { ewsService } from '../../../../../../services'
import { createApiResponse } from '../../../../../../utils/response'
import { requireUserAuth } from '../../../../../../utils/auth'
import { handleServerError, BadRequestError, ForbiddenError } from '../../../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const classId = getRouterParam(event, 'classId')
    const studentId = getRouterParam(event, 'studentId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }
    if (!studentId) {
      throw new BadRequestError('ID Mahasiswa wajib disertakan pada parameter URL')
    }

    // Mahasiswa hanya dapat melihat telemetri miliknya sendiri
    if (user.role === 'student' && user.id !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki hak untuk melihat profil risiko mahasiswa lain')
    }

    const profile = await ewsService.getStudentEwsDetail(classId, studentId)

    return createApiResponse(
      profile,
      `Telemetri EWS mahasiswa '${profile.studentName}': Status ${profile.riskLabel} (${profile.riskColor})`,
      {
        studentId: profile.studentId,
        riskLevel: profile.overallRiskLevel,
        riskScore: profile.compositeRiskScore,
        urgency: profile.interventionRecommendations.urgency,
        attendanceDisqualified: profile.attendance.isDisqualified,
        missingAssignments: profile.assignments.missingCount,
        examBelowStandard: profile.exams.isBelowPassingStandard,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
