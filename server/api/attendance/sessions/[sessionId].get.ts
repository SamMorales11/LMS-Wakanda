import { attendanceService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserAuth(event)

    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw new BadRequestError('ID sesi perkuliahan wajib disertakan')
    }

    const query = getQuery(event)
    const classId = typeof query.classId === 'string' ? query.classId : undefined

    const overview = await attendanceService.getSessionAttendanceOverview(sessionId, classId)

    return createApiResponse(
      overview,
      `Data presensi sesi #${overview.sessionNumber} berhasil diambil`,
      {
        sessionId: overview.sessionId,
        totalEnrolled: overview.totalEnrolled,
        presentCount: overview.presentCount,
        hasActiveToken: !!overview.activeToken,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
