import { z, type ZodSchema } from 'zod'
import { ValidationError } from './errors'

/**
 * Validates the H3 request body using a Zod schema.
 */
export const validateBody = async <T>(event: H3Event, schema: ZodSchema<T>): Promise<T> => {
  const body = await readBody(event).catch(() => ({}))
  const result = schema.safeParse(body)

  if (!result.success) {
    const issues = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    throw new ValidationError('Validation failed for request body', issues)
  }

  return result.data
}

/**
 * Validates the H3 query parameters using a Zod schema.
 */
export const validateQuery = <T>(event: H3Event, schema: ZodSchema<T>): T => {
  const query = getQuery(event)
  const result = schema.safeParse(query)

  if (!result.success) {
    const issues = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    throw new ValidationError('Validation failed for query parameters', issues)
  }

  return result.data
}
