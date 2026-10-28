import { assignmentService } from '../../../../services'
import { createSubmissionSchema } from '../../../../utils/schemas'
import { validateBody } from '../../../../utils/validation'
import { createApiResponse } from '../../../../utils/response'
import { requireUserAuth } from '../../../../utils/auth'
import { BadRequestError, handleServerError } from '../../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = requireUserAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new BadRequestError('ID Tugas wajib disertakan')
    }

    const body = await validateBody(event, createSubmissionSchema)

    const protocol = getRequestProtocol(event)
    const host = getRequestHost(event)
    const origin = `${protocol}://${host}`

    const result = await assignmentService.submitAssignment(
      user.id,
      {
        ...body,
        assignmentId: id
      },
      origin
    )

    setResponseStatus(event, 201)
    return createApiResponse(
      result.submission,
      result.message,
      {
        assignmentId: id,
        studentId: user.id,
        isLate: result.submission.isLate,
        timingStatus: result.submission.timingStatus,
        timingLabel: result.submission.timingLabel,
        timingColor: result.submission.timingColor,
        submittedAt: result.submission.submittedAt,
        requestId: event.context.requestId
      }
    )
  } catch (error) {
    return handleServerError(error)
  }
})
