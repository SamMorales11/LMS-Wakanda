import { attendanceService } from '../../services'
import { openAttendanceSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const body = await validateBody(event, openAttendanceSchema)

    const tokenData = await attendanceService.openAttendanceSession(body, user.id)

    return createApiResponse(
      tokenData,
      `Sesi presensi berhasil dibuka dengan PIN ${tokenData.formattedToken} (berlaku ${body.durationMinutes} menit)`,
      {
        sessionId: body.sessionId,
        expiresAt: tokenData.validUntil,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
