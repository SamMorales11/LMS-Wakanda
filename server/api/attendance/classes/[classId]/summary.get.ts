import { attendanceService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)

    const classId = getRouterParam(event, 'classId')
    if (!classId) {
      throw new BadRequestError('ID kelas wajib disertakan')
    }

    const query = getQuery(event)
    let targetStudentId = typeof query.studentId === 'string' ? query.studentId : undefined

    if (user.role === 'student') {
      targetStudentId = user.id
    } else if (!targetStudentId) {
      throw new BadRequestError('Parameter query studentId wajib disertakan untuk peran Dosen / Admin')
    }

    const summary = await attendanceService.calculateStudentAttendanceSummary(classId, targetStudentId)

    return createApiResponse(
      summary,
      `Rekap presensi mahasiswa: ${summary.attendancePercentage.toFixed(1)}% (${summary.isEligibleForFinalExam ? 'Memenuhi Syarat UAS' : 'Tidak Memenuhi Syarat UAS'})`,
      {
        classId: summary.classId,
        studentId: summary.studentId,
        percentage: summary.attendancePercentage,
        isEligibleForFinalExam: summary.isEligibleForFinalExam,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
