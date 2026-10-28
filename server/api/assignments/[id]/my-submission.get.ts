import { assignmentService } from '../../../services'
import { createApiResponse } from '../../../utils/response'
import { requireUserAuth } from '../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const submission = await assignmentService.getMySubmission(id, user.id)

    return createApiResponse(
      submission,
      submission ? 'Data pengumpulan tugas Anda berhasil diambil' : 'Belum ada pengumpulan tugas untuk tugas ini',
      {
        assignmentId: id,
        studentId: user.id,
        hasSubmitted: !!submission,
        isLate: submission?.isLate ?? null,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
