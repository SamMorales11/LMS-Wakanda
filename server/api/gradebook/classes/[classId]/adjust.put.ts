import { gradebookService } from '../../../../services'
import { manualGradeAdjustmentSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const body = await validateBody(event, manualGradeAdjustmentSchema)

    // Capture IP address for audit trail
    const forwardedFor = getRequestHeader(event, 'x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : event.node.req.socket.remoteAddress

    const result = await gradebookService.adjustStudentGradeManual(
      classId,
      body,
      user.id,
      ipAddress
    )

    return createApiResponse(
      result,
      `Penyesuaian nilai mahasiswa '${result.auditLog.studentName}' berhasil dicatat ke audit log`,
      {
        classId,
        studentId: body.studentId,
        previousScore: result.auditLog.previousScore,
        newScore: result.auditLog.newScore,
        previousLetter: result.auditLog.previousLetter,
        newLetter: result.auditLog.newLetter,
        auditLogId: result.auditLog.id,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
