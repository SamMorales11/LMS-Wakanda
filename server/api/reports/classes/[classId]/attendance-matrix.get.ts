import { exportService } from '../../../../services'
import { createApiResponse } from '../../../../utils/response'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')
    const query = getQuery(event)
    const format = (query.format as string) || 'xlsx'

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    if (format.toLowerCase() === 'json') {
      const matrix = await exportService.getAttendanceMatrixData(classId)
      return createApiResponse(
        matrix,
        `Berhasil memuat data matriks presensi 16 pertemuan kelas '${matrix.className}'`,
        {
          classId: matrix.classId,
          totalStudents: matrix.students.length,
          classAverageAttendance: matrix.classAverageAttendance,
          eligibleCount: matrix.eligibleCount,
          disqualifiedCount: matrix.disqualifiedCount,
          requestId: event.context.requestId
        }
      )
    }

    // Default: Excel (.xlsx)
    const buffer = await exportService.generateAttendanceMatrixExcel(classId)
    const metadata = await exportService.getAcademicMetadata(classId)
    const safeFilename = `Matriks_Presensi_${metadata.courseCode}_${metadata.classCode}`.replace(/[^a-zA-Z0-9_-]/g, '_')

    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeFilename}.xlsx"`,
      'Content-Length': buffer.length.toString()
    })

    return buffer
  } catch (error) {
    return handleServerError(error)
  }
})
