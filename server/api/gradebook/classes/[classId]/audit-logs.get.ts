import { gradebookService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const logs = await gradebookService.getClassAuditLogs(classId)

    return createApiResponse(
      logs,
      `Berhasil memuat ${logs.length} riwayat audit log perubahan nilai kelas`,
      {
        classId,
        totalLogs: logs.length,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
