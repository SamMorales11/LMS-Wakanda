import { exportService } from '../../../../services'
import { requireUserRole } from '../../../../utils/auth'
import { handleServerError, BadRequestError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    requireUserRole(event, ['lecturer', 'admin'])
    const classId = getRouterParam(event, 'classId')

    if (!classId) {
      throw new BadRequestError('ID Kelas wajib disertakan pada parameter URL')
    }

    const html = await exportService.generateGradebookHtml(classId)

    setResponseHeaders(event, {
      'Content-Type': 'text/html; charset=utf-8'
    })

    return html
  } catch (error) {
    return handleServerError(error)
  }
})
