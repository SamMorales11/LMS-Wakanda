import { attendanceService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])

    const classId = getRouterParam(event, 'classId')
    if (!classId) {
      throw new BadRequestError('ID kelas wajib disertakan')
    }

    const recap = await attendanceService.getClassAttendanceRecap(classId)

    return createApiResponse(
      recap,
      `Matriks rekapitulasi presensi semester (${recap.students.length} mahasiswa) berhasil dimuat`,
      {
        classId,
        studentCount: recap.students.length,
        totalSessions: recap.totalSessions,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
