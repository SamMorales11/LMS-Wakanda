import { attendanceService } from '../../services'
import { checkInSchema } from '../../utils/schemas'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserAuth } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const body = await validateBody(event, checkInSchema)

    const result = await attendanceService.checkIn(user.id, body)

    return createApiResponse(
      result,
      `Presensi berhasil dicatat: Status ${result.log.status}`,
      {
        studentId: user.id,
        sessionId: result.log.sessionId,
        attendanceStatus: result.log.status,
        eligibleForUAS: result.summary.isEligibleForFinalExam,
        percentage: result.summary.attendancePercentage,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
