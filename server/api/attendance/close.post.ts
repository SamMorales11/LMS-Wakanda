import { z } from 'zod'
import { attendanceService } from '../../services'
import { validateBody } from '../../utils/validation'
import { createApiResponse } from '../../utils/response'
import { requireUserRole } from '../../utils/auth'
import { handleServerError } from '../../utils/errors'

const closeAttendanceSchema = z.object({
  sessionId: z.string({ required_error: 'ID Sesi wajib disertakan' }).uuid('Format ID sesi harus UUID valid')
})

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const body = await validateBody(event, closeAttendanceSchema)

    const result = await attendanceService.closeAttendanceSession(body.sessionId)

    return createApiResponse(
      result,
      result.message,
      {
        sessionId: body.sessionId,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
