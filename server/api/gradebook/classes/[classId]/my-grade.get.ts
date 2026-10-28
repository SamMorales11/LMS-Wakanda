import { gradebookService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const studentGrade = await gradebookService.getStudentGrade(classId, user.id)

    return createApiResponse(
      studentGrade,
      `Berhasil memuat rincian evaluasi akademik mahasiswa: ${studentGrade.studentName}`,
      {
        classId,
        studentId: user.id,
        numericScore: studentGrade.finalGrade.numericScore,
        letterGrade: studentGrade.finalGrade.letterGrade,
        gradePoint: studentGrade.finalGrade.gradePoint,
        attendanceEligible: studentGrade.attendance.isEligible,
        isAttendanceDisqualified: studentGrade.finalGrade.isAttendanceDisqualified,
        gradeStatus: studentGrade.finalGrade.status,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
