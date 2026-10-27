import { attendanceService } from '../../services'
import { manualAttendanceSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const body = await validateBody(event, manualAttendanceSchema)

    const updatedLog = await attendanceService.manualUpdateStatus(body, user.id)

    return createApiResponse(
      updatedLog,
      `Status presensi mahasiswa berhasil diperbarui menjadi ${updatedLog.status}`,
      {
        sessionId: body.sessionId,
        studentId: body.studentId,
        status: updatedLog.status,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
