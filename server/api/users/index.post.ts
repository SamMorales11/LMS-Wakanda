import { userService } from '../../../server/services'
import { createUserSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError } from '../../../server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await validateBody(event, createUserSchema)
    const newUser = await userService.createUser(body)
    setResponseStatus(event, 201)
    return createApiResponse(newUser, 'User created successfully', {
      requestId: event.context.requestId
    })
  } catch (error) {
    return handleServerError(error)
  }
})
