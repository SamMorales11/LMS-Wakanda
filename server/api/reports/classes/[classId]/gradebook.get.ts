import { exportService } from '../../../../services'
import { classRepository } from '../../../../repositories'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError, ForbiddenError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')
    const query = getQuery(event)
    const format = (query.format as string) || 'xlsx'

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    if (user.role === 'lecturer') {
      const isAssigned = await classRepository.isLecturerAssignedToClass(classId, user.id)
      if (!isAssigned) {
        throw new ForbiddenError('Akses ditolak: Anda bukan dosen pengampu untuk kelas ini')
      }
    }

    if (format.toLowerCase() === 'html') {
      const html = await exportService.generateGradebookHtml(classId)
      setResponseHeaders(event, {
        'Content-Type': 'text/html; charset=utf-8'
      })
      return html
    }

    // Default: Excel (.xlsx)
    const buffer = await exportService.generateGradebookExcel(classId)
    const metadata = await exportService.getAcademicMetadata(classId)
    const safeFilename = `Rekap_Nilai_${metadata.courseCode}_${metadata.classCode}`.replace(/[^a-zA-Z0-9_-]/g, '_')

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
